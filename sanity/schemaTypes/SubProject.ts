export default {
  name: "subProject",
  title: "Sub Project",
  type: "document",
  fields: [
    {
      name: "name",
      title: "Name",
      type: "string",
    },
    {
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "نشط", value: "نشط" },
          { title: "مكتمل", value: "مكتمل" },
          { title: "مؤجل", value: "مؤجل" },
        ],
      },
    },
    {
      name: "sessions",
      title: "Sessions",
      type: "array",
      of: [{ type: "reference", to: [{ type: "session" }] }],
    },
  ],
};
