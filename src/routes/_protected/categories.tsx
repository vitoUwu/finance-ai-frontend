import { createFileRoute } from "@tanstack/react-router";
import { CategoriesPage } from "../../pages/categories";

export const Route = createFileRoute("/_protected/categories")({
  component: CategoriesPage,
});
