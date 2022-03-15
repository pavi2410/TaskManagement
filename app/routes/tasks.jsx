import { json, Link, useCatch } from "remix";
import { getUserId } from "~/utils/session.server";

export default function () {
  return (
    <div>tasks</div>
  )
}

export const loader = async ({ request }) => {
  const userId = await getUserId(request);
  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return json({});
};

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 401) {
    return (
      <div className="error-container">
        <p>You must be logged in to access this app.</p>
        <Link to="/login?redirectTo=/tasks">Login</Link>
      </div>
    );
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}