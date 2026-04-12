const isProduction = process.env.NODE_ENV === "production";

export default {
  layout: "layouts/post.njk",
  tags: ["blog"],
  extraCss: "/css/blog.css",
  permalink: (data) => {
    // Draft posts excluded from production builds
    if (isProduction && data.draft) return false;
    return undefined; // use default permalink
  },
};
