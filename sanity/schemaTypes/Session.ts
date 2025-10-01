export default {
  name: "session",
  title: "Session",
  type: "document",
  fields: [
    {
      name: "date",
      title: "Date",
      type: "date",
    },
    {
      name: "time",
      title: "Time",
      type: "string",
    },
    {
      name: "hours",
      title: "Hours",
      type: "string",
    },
    {
      name: "minutes",
      title: "Minutes",
      type: "string",
    },
    {
      name: "notes",
      title: "Notes",
      type: "text",
    },
    {
      name: "project",
      title: "Project",
      type: "reference",
      to: [{ type: "project" }, { type: "subProject" }],
    },
  ],
};