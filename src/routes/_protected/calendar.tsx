import { createFileRoute } from "@tanstack/react-router";
import { CalendarPage } from "../../pages/calendar";

export const Route = createFileRoute("/_protected/calendar")({
  component: CalendarPage,
});
