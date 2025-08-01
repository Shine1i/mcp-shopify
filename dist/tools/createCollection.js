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
let graphQLClient;
const createCollection = {
    name: "create-collection",
    description: "Create a new collection in Shopify",
    initialize(client) {
        graphQLClient = client;
    },
    schema: CreateCollectionInputSchema,
    execute: async (input) => {
        try {
            // Format the input for the GraphQL mutation
            const mutationInput = {
                title: input.title,
                descriptionHtml: input.descriptionHtml,
                handle: input.handle,
                seo: input.seo,
                image: input.image,
                sortOrder: input.sortOrder,
                templateSuffix: input.templateSuffix,
                metafields: input.metafields,
                ruleSet: input.ruleSet,
            };
            // Base mutation for collection creation
            const query = gql `
        mutation collectionCreate($input: CollectionInput!) {
          collectionCreate(input: $input) {
            collection {
              id
              handle
              title
              updatedAt
              descriptionHtml
              publishedOnCurrentPublication
              sortOrder
              templateSuffix
              seo {
                title
                description
              }
              image {
                src
                altText
              }
              metafields {
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
            const response = await graphQLClient.request(query, {
                input: mutationInput,
            });
            if (response.collectionCreate.userErrors.length > 0) {
                throw new Error(`Failed to create collection: ${response.collectionCreate.userErrors
                    .map((e) => e.message)
                    .join(", ")}`);
            }
            const collection = response.collectionCreate.collection;
            // Format and return the collection with the correct interface
            return {
                id: collection.id,
                handle: collection.handle,
                title: collection.title,
                updatedAt: collection.updatedAt,
                descriptionHtml: collection.descriptionHtml,
                publishedOnCurrentPublication: collection.publishedOnCurrentPublication,
                sortOrder: collection.sortOrder,
                templateSuffix: collection.templateSuffix,
                seo: collection.seo,
                image: collection.image,
                metafields: collection.metafields,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("Error creating collection:", errorMessage);
            throw new Error(`Failed to create collection: ${errorMessage}`);
        }
    },
};
export { createCollection };
//# sourceMappingURL=createCollection.js.map