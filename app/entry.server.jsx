import { renderToString } from "react-dom/server";
import { RemixServer } from "@remix-run/react";
import { injectStylesIntoStaticMarkup } from "@mantine/ssr";
import  "dotenv/config"

export default function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  remixContext
) {
  const markup = renderToString(
    <RemixServer context={remixContext} url={request.url} />
  );

  responseHeaders.set("Content-Type", "text/html");

  return new Response("<!DOCTYPE html>" + injectStylesIntoStaticMarkup(markup), {
    status: responseStatusCode,
    headers: responseHeaders
  });
}
