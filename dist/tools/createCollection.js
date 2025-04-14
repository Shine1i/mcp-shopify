import { gql } from "graphql-request";
import { z } from "zod";
// Input schema for creating a collection
const CreateCollectionInputSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    descriptionHtml: z.string().optional(),
    handle: z.string().optional(),
    isPublished: z.boolean().optional(),
    seo: z
        .object({
        title: z.string().optional(),
        description: z.string().optional()
    })
        .optional(),
    image: z
        .object({
        src: z.string().url("Image source must be a valid URL"),
        altText: z.string().optional()
    })
        .optional(),
    productsToAdd: z.array(z.string()).optional(),
    sortOrder: z
        .enum([
        "MANUAL",
        "BEST_SELLING",
        "ALPHA_ASC",
        "ALPHA_DESC",
        "PRICE_DESC",
        "PRICE_ASC",
        "CREATED",
        "CREATED_DESC",
        "ID_DESC",
        "RELEVANCE"
    ])
        .optional(),
    templateSuffix: z.string().optional(),
    privateMetafields: z
        .array(z.object({
        owner: z.string(),
        namespace: z.string(),
        key: z.string(),
        value: z.string(),
        valueType: z.enum([
            "STRING",
            "INTEGER",
            "JSON_STRING",
            "BOOLEAN",
            "FLOAT",
            "COLOR",
            "DIMENSION",
            "RATING",
            "SINGLE_LINE_TEXT_FIELD",
            "MULTI_LINE_TEXT_FIELD",
            "DATE",
            "DATE_TIME",
            "URL",
            "JSON",
            "VOLUME",
            "WEIGHT"
        ])
    }))
        .optional(),
    ruleSet: z
        .object({
        rules: z.array(z.object({
            column: z.enum([
                "TAG",
                "TITLE",
                "TYPE",
                "VENDOR",
                "VARIANT_PRICE",
                "VARIANT_COMPARE_AT_PRICE",
                "VARIANT_WEIGHT",
                "VARIANT_INVENTORY",
                "VARIANT_TITLE",
                "IS_PRICE_REDUCED",
                "VARIANT_BARCODE"
            ]),
            relation: z.enum([
                "EQUALS",
                "NOT_EQUALS",
                "GREATER_THAN",
                "LESS_THAN",
                "STARTS_WITH",
                "ENDS_WITH",
                "CONTAINS",
                "NOT_CONTAINS",
                "IS_SET",
                "IS_NOT_SET"
            ]),
            condition: z.string()
        })),
        appliedDisjunctively: z.boolean().default(true)
    })
        .optional(),
    metafields: z
        .array(z.object({
        namespace: z.string(),
        key: z.string(),
        value: z.string(),
        type: z.string()
    }))
        .optional(),
    publications: z
        .array(z.object({
        publicationId: z.string(),
        publishDate: z.string().optional()
    }))
        .optional()
});
// Will be initialized in index.ts
let shopifyClient;
const createCollection = {
    name: "create-collection",
    description: "Create a new collection in Shopify",
    schema: CreateCollectionInputSchema,
    // Add initialize method to set up the GraphQL client
    initialize(client) {
        shopifyClient = client;
    },
    execute: async (input) => {
        try {
            // Determine if we're creating a custom or automated collection
            const isAutomatedCollection = !!input.ruleSet;
            // Base mutation for collection creation
            const query = gql `
        mutation collectionCreate($input: CollectionInput!) {
          collectionCreate(input: $input) {
            collection {
              id
              title
              description
              descriptionHtml
              handle
              updatedAt
              publishedAt
              seo {
                title
                description
              }
              image {
                id
                src
                altText
                width
                height
              }
              sortOrder
              templateSuffix
              productsCount
              metafields(first: 20) {
                edges {
                  node {
                    id
                    namespace
                    key
                    value
                    type
                  }
                }
              }
              privateMetafields(first: 20) {
                edges {
                  node {
                    id
                    namespace
                    key
                    value
                    valueType
                  }
                }
              }
              ruleSet {
                rules {
                  column
                  relation
                  condition
                }
                appliedDisjunctively
              }
              publications(first: 20) {
                edges {
                  node {
                    id
                    name
                    publishDate
                  }
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;
            // Prepare the mutation input
            const collectionInput = {
                title: input.title
            };
            // Add optional fields if provided
            if (input.description) {
                collectionInput.description = input.description;
            }
            if (input.descriptionHtml) {
                collectionInput.descriptionHtml = input.descriptionHtml;
            }
            if (input.handle) {
                collectionInput.handle = input.handle;
            }
            if (input.isPublished !== undefined) {
                collectionInput.published = input.isPublished;
            }
            if (input.seo) {
                collectionInput.seo = input.seo;
            }
            if (input.image) {
                collectionInput.image = input.image;
            }
            if (input.sortOrder) {
                collectionInput.sortOrder = input.sortOrder;
            }
            if (input.templateSuffix) {
                collectionInput.templateSuffix = input.templateSuffix;
            }
            if (input.ruleSet) {
                collectionInput.ruleSet = input.ruleSet;
            }
            // Convert product IDs to GID format if they aren't already
            if (input.productsToAdd && input.productsToAdd.length > 0) {
                collectionInput.productsToAdd = input.productsToAdd.map(id => id.startsWith('gid://') ? id : `gid://shopify/Product/${id}`);
            }
            // Add metafields if provided
            if (input.metafields && input.metafields.length > 0) {
                collectionInput.metafields = input.metafields;
            }
            if (input.privateMetafields && input.privateMetafields.length > 0) {
                collectionInput.privateMetafields = input.privateMetafields;
            }
            if (input.publications && input.publications.length > 0) {
                collectionInput.publications = input.publications;
            }
            const variables = {
                input: collectionInput
            };
            const data = (await shopifyClient.request(query, variables));
            // If there are user errors, throw an error
            if (data.collectionCreate.userErrors.length > 0) {
                throw new Error(`Failed to create collection: ${data.collectionCreate.userErrors
                    .map((e) => `${e.field}: ${e.message}`)
                    .join(", ")}`);
            }
            // Format and return the created collection
            const collection = data.collectionCreate.collection;
            // Format metafields if they exist
            const metafields = collection.metafields?.edges.map((edge) => edge.node) || [];
            const privateMetafields = collection.privateMetafields?.edges.map((edge) => edge.node) || [];
            const publications = collection.publications?.edges.map((edge) => edge.node) || [];
            const formattedCollection = {
                id: collection.id,
                title: collection.title,
                description: collection.description,
                descriptionHtml: collection.descriptionHtml,
                handle: collection.handle,
                updatedAt: collection.updatedAt,
                publishedAt: collection.publishedAt,
                seo: collection.seo,
                image: collection.image,
                sortOrder: collection.sortOrder,
                templateSuffix: collection.templateSuffix,
                productsCount: collection.productsCount,
                metafields,
                privateMetafields,
                publications: publications.map((publication) => ({
                    publicationId: publication.id,
                    publishDate: publication.publishDate,
                })),
            };
            // Add ruleSet for automated collections
            if (isAutomatedCollection && collection.ruleSet) {
                formattedCollection.ruleSet = collection.ruleSet;
            }
            return {
                collection: formattedCollection
            };
        }
        catch (error) {
            console.error("Error creating collection:", error);
            throw new Error(`Failed to create collection: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
};
export { createCollection };
//# sourceMappingURL=createCollection.js.map