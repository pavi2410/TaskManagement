import { AppShell, Autocomplete, Button, Group, Header, NumberInput, Paper, Stack, Text, TextInput } from "@mantine/core";
import { Form, json, redirect, useLoaderData } from "remix";
import { db } from "~/utils/db.server";
import { getUserId } from "~/utils/session.server";
import _ from "lodash";

export default function () {
  const loaderData = useLoaderData()

  const categories = _.groupBy(loaderData.userInfo.tasks, 'status')

  return (
    <AppShell
      header={
        <Header height={60} p="md">Taskmate</Header>
      }
    >
      {/* {JSON.stringify(categories, null, 2)} */}
      <Board categories={categories} />
    </AppShell>
  )
}

function Board({ categories }) {
  return (
    <Group>
      {_.map(categories, (tasks, category) => <Column category={category} tasks={tasks} key={category} />)}
    </Group>
  )
}

function Column({ category, tasks }) {
  const sortedTasks = _.sortBy(tasks, 'priority');
  return (
    <Paper shadow="xs" radius="md" p="md">
      <Stack>
        <Text>{category}</Text>
        {sortedTasks.map(task => <Task task={task} key={task.id} />)}
        <Form method="POST">
          <TextInput name="name" placeholder="name" />
          <TextInput name="description" placeholder="description" />
          <Autocomplete name="status" placeholder="status" data={['Todo', 'InProgress', 'Done']} />
          <NumberInput name="priority" placeholder="priority" />
          <Button type="submit">Add new task</Button>
        </Form>
      </Stack>
    </Paper>
  )
}

function Task({ task }) {
  return (
    <div>
      <Text>{task.name}</Text>
      <Text>{task.description}</Text>
      <Form method="DELETE">
        <input type="hidden" name="_method" value="delete" />
        <input type="hidden" name="task_id" value={task.id} />
        <Button type="submit" variant="filled" color="red" compact>
          Delete
        </Button>
      </Form>
    </div>
  )
}

export const loader = async ({ request }) => {
  const userId = await getUserId(request);
  if (!userId) {
    return redirect("/login?redirectTo=/tasks")
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