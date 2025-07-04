import { list } from "@keystone-6/core";
import { allowAll } from "@keystone-6/core/access";
import { json, text, relationship, image } from "@keystone-6/core/fields";
import { isSignedIn, permissions } from "../access";

export const TodoImage = list({
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canCreateTodos,
      update: permissions.canCreateTodos,
      delete: permissions.canCreateTodos,
    },
  },
  fields: {
    image: image({ storage: "my_images" }),
    imagePath: text(),
    altText: text(),
    todos: relationship({ ref: "Todo.todoImages", many: true }),
    metadata: json(),
  },
  ui: {
    listView: {
      initialColumns: ["image", "imagePath", "altText", "todos"],
    },
  },
});