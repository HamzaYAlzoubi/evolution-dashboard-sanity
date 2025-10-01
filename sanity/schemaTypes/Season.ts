export default {
  name: "season",
  title: "Season",
  type: "document",
  fields: [
    {
      name: "name",
      title: "Name",
      type: "string",
      description: "e.g., 'معسكر أكتوبر 2025'",
    },
    {
      name: "startDate",
      title: "Start Date",
      type: "date",
    },
    {
      name: "endDate",
      title: "End Date",
      type: "date",
    },
    {
      name: "champion",
      title: "Champion",
      type: "reference",
      to: [{ type: "user" }],
      description: "The user with the highest achievement in this season.",
    },
    {
      name: "survivors",
      title: "Survivors",
      type: "array",
      of: [{ type: "reference", to: [{ type: "user" }] }],
      description: "List of all users who survived this season's camp.",
    },
  ],
};