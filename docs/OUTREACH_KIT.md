# Spark Desktop — Outreach Kit

Use this material when introducing Spark Desktop publicly. Keep the project positioned as an independent interoperability experiment, not an official Google product.

## One-line description

**Spark Desktop is an independent Windows shell for Gemini Spark that adds native tabs, persistent sessions, Google Docs/Sheets continuity, and signed automatic updates without becoming a general-purpose browser.**

## Short technical pitch

Spark Desktop explores what a focused first-class Windows workflow around Gemini Spark can look like while leaving the Gemini UI and Google authentication untouched. It uses Tauri 2, React/TypeScript, and Microsoft Edge WebView2, with child webviews for Spark and related Google Workspace documents.

The most useful findings from the prototype are documented in [`GEMINI_SPARK_DESKTOP_FINDINGS.md`](GEMINI_SPARK_DESKTOP_FINDINGS.md).

## Suggested Gemini feedback text

> I built Spark Desktop, an independent Windows prototype that wraps Gemini Spark in a minimal native shell with multi-tab workspaces, persistent sessions, internal Google Docs/Sheets handoff, and signed automatic updates. While building it I documented several integration findings around WebView popup semantics, Workspace navigation, and desktop workflow continuity. I would value guidance on recommended embedding/integration boundaries for Gemini web surfaces in desktop WebView hosts. Project and findings: https://github.com/sufyanaser/Spark-Desktop

## Suggested community post title

**I built a focused Windows desktop shell for Gemini Spark — here are the WebView and Google Workspace integration findings**

## Suggested community post body

Spark Desktop is a small independent Windows experiment built around a simple question: what desktop behavior is genuinely useful around Gemini Spark without reimplementing Gemini or turning the app into another browser?

The current prototype adds native tabs/windows, persistent Google session state, internal Google Docs/Sheets handoff, keyboard controls, and signed automatic updates. The most interesting part was not the shell UI; it was learning how modern Google Workspace flows behave when a WebView host intercepts popup/navigation behavior.

I documented the product and integration findings here:
https://github.com/sufyanaser/Spark-Desktop/blob/main/docs/GEMINI_SPARK_DESKTOP_FINDINGS.md

Repository:
https://github.com/sufyanaser/Spark-Desktop

I would especially appreciate feedback on recommended WebView embedding boundaries and how related Workspace surfaces should be handled when opened from Gemini Spark.

Spark Desktop is independent and is not affiliated with, endorsed by, or sponsored by Google.

## Suggested social post

**Built: Spark Desktop** — a focused Windows shell around Gemini Spark.

Native tabs. Persistent sessions. Docs/Sheets stay in the same desktop workspace. Signed automatic updates. No address bar, bookmarks, or attempt to rebuild Gemini.

The useful part of the experiment was the integration work: WebView2 popup semantics, Workspace navigation, session continuity, and defining where a desktop shell should stop.

Project: https://github.com/sufyanaser/Spark-Desktop

Engineering findings: https://github.com/sufyanaser/Spark-Desktop/blob/main/docs/GEMINI_SPARK_DESKTOP_FINDINGS.md

Independent community project; not affiliated with Google.

## Public demo checklist

Before publishing screenshots or video:

- use a test/demo Google account where possible;
- remove private prompts, emails, documents, phone numbers, avatars, and personal data;
- show Spark Desktop's own chrome naturally;
- do not alter Google's UI to imply a first-party application;
- do not use Google/Gemini logos as Spark Desktop's project logo;
- keep the independent-project disclaimer visible in the repository and post context.

## Official channels worth using

- Gemini Apps in-product feedback: `https://support.google.com/gemini/answer/13275746`
- Gemini Apps Help Community: `https://support.google.com/gemini/community`
- Google Brand Resource Center guidance: `https://about.google/brand-resource-center/guidance/`

Always follow the current rules of the destination community before posting.
