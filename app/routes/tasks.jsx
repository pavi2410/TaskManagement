import { Autocomplete, Button, NumberInput, Text, TextInput } from "@mantine/core";
import { Form, json, Link, useCatch, useLoaderData } from "remix";
import { db } from "~/utils/db.server";
import { getUserId } from "~/utils/session.server";

export default function () {
  const loaderData = useLoaderData()
  return (
    <div>
      <div>
        {loaderData.userInfo.tasks?.map(task => (
          <div>
            <Text>{task.name}</Text>
            <Text>{task.description}</Text>
            <Text>{task.status}</Text>
            <Text>{task.priority}</Text>
            <Form method="DELETE">
              <input type="hidden" name="_method" value="delete" />
              <input type="hidden" name="task_id" value={task.id} />
              <Button type="submit" variant="filled" color="red" compact>
                Delete
              </Button>
            </Form>
          </div>
        ))}
        <Form method="POST">
          <TextInput name="name" placeholder="name" />
          <TextInput name="description" placeholder="description" />
          <Autocomplete name="status" placeholder="status" data={['Todo', 'InProgress', 'Done']} />
          <NumberInput name="priority" placeholder="priority" />
          <Button type="submit">Add new task</Button>
        </Form>
      </div>
      <pre>{JSON.stringify(loaderData, null, 2)}</pre>
    </div>
  )
}

export const loader = async ({ request }) => {
  const userId = await getUserId(request);
  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }
  const userInfo = await db.user.findUnique({
    where: { id: userId },
    include: {
      tasks: true,
    }
  })
  return json({ userInfo });
};

export const action = async ({ request }) => {
  const form = await request.formData();
  const userId = await getUserId(request);
  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }
  if (request.method === 'POST') {
    const task = await db.task.create({
      data: {
        name: form.get("name"),
        description: form.get("description"),
        status: form.get("status"),
        priority: parseInt(form.get("priority")),
        User: {
          connect: { id: userId }
        },
      }
    })
    return json({});
  } else if (request.method === 'DELETE') {
    const taskId = form.get("task_id");
    const task = await db.task.delete({
      where: { id: taskId },
    })
    return json({});
  }
}

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