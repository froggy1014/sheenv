module.exports = {
  types: [
    { value: "✨ feat", name: "✨ feat:     Add a new feature" },
    { value: "🐛 fix", name: "🐛 fix:      Fix a bug" },
    { value: "📝 docs", name: "📝 docs:     Documentation changes" },
    {
      value: "💅 style",
      name: "💅 style:    Changes that do not affect the meaning of the code (white-space, formatting, etc.)",
    },
    {
      value: "♻️ refactor",
      name: "♻️ refactor:  Code changes that neither fix a bug nor add a feature",
    },
    {
      value: "👷 cicd",
      name: "👷 cicd:     Changes related to CI/CD",
    },
    {
      value: "✅ test",
      name: "✅ test:     Add or update tests",
    },
    {
      value: "🔧 chore",
      name: "🔧 chore:    Changes to the build process or auxiliary tools and libraries (documentation generation, etc.)",
    },
    { value: "🔨 settings", name: "🔨 Settings: Commit related to settings" },
  ],

  allowCustomScopes: false,
  usePreparedCommit: true,
  skipQuestions: ["scope", "body", "footer"],
  isTicketNumberRequired: false,
  ticketNumberPrefix: "ISSUE-",
  ticketNumberRegExp: "\\d{1,5}",

  messages: {
    type: "Please select the type of commit.\n",
    subject: "Please write a subject.\n",
    confirmCommit:
      "Please confirm your commit. (Press enter to confirm, n to cancel, e to edit, h for help)",
  },

  // limit subject length
  subjectLimit: 100,
};
