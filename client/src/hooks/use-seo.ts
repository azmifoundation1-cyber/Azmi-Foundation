import { useEffect } from "react";

interface SEOOptions {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const SITE_NAME = "Azmi Foundation";
const DEFAULT_DESCRIPTION = "Azmi Foundation is an 80G & FCRA registered NGO based in Ahmedabad. Donate to life-changing campaigns — healthcare, education, food relief & more.";
const DEFAULT_IMAGE = "https://www.azmifoundation.com/azmi-logo.png";
const BASE_URL = "https://www.azmifoundation.com";

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function useSEO({ title, description, image, url, type = "website" }: SEOOptions) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Donate to Change Lives`;
    const desc = description || DEFAULT_DESCRIPTION;
    const img = image || DEFAULT_IMAGE;
    const pageUrl = url ? `${BASE_URL}${url}` : BASE_URL;

    document.title = fullTitle;

    setMeta("description", desc);

    setMeta("og:title", fullTitle, "property");
    setMeta("og:description", desc, "property");
    setMeta("og:image", img, "property");
    setMeta("og:url", pageUrl, "property");
    setMeta("og:type", type, "property");
    setMeta("og:site_name", SITE_NAME, "property");

    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", desc);
    setMeta("twitter:image", img);

    setLink("canonical", pageUrl);

    return () => {
      document.title = `${SITE_NAME} — Donate to Change Lives`;
    };
  }, [title, description, image, url, type]);
}
