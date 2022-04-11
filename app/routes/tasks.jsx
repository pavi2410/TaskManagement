import { AppShell, Button, Group, Header, Modal, Paper, Popover, Select, Stack, Text, Textarea, TextInput, Title } from "@mantine/core";
import { DatePicker } from '@mantine/dates';
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { getUserId } from "~/utils/session.server";
import _ from "lodash";
import { useState } from "react";

const CATEGORIES = { 'ToDo': [], 'InProgress': [], 'Done': [], 'Backlog': [] }
const isBacklog = (task) => new Date(task.deadline) < new Date()

export default function () {
  const { userInfo: { tasks, ...user } } = useLoaderData()

  const categories = _.defaults(_.groupBy(tasks, 'category'), CATEGORIES)
  const todoItems = _.partition(categories.ToDo, isBacklog)
  categories.Backlog = todoItems[0]
  categories.ToDo = todoItems[1]

  return (
    <AppShell
      header={
        <Header height={60} py="xs" px="xl">
          <Group sx={{ height: '100%' }} position="apart">
            <Text
              component="span"
              align="center"
              variant="gradient"
              gradient={{ from: 'indigo', to: 'pink', deg: 45 }}
              size="xl"
              weight={700}
            >
              TaskMate
            </Text>
            <AccountButton user={user} />
          </Group>
        </Header>
      }
      fixed
      sx={theme => ({ main: { background: theme.colors.gray[0] } })}
    >
      {/* {JSON.stringify(categories, null, 2)} */}
      <Board categories={categories} />
    </AppShell>
  )
}

function AccountButton({ user }) {
  const [opened, setOpened] = useState(false);
  return (
    <Popover
      opened={opened}
      onClose={() => setOpened(false)}
      target={<Button variant="subtle" onClick={() => setOpened((o) => !o)}>Hi {user.name}! 👋</Button>}
      position="bottom"
      withArrow
    >
      <Stack>
        <Text>{user.email}</Text>
        <Form action="/logout" method="POST">
          <Button type="submit">Logout</Button>
        </Form>
      </Stack>
    </Popover>
  );
}

function Board({ categories }) {
  return (
    <Group align="start">
      {_.map(_.keys(CATEGORIES), (category) => <Column category={category} tasks={categories[category]} key={category} />)}
    </Group>
  )
}

function Column({ category, tasks }) {
  const [opened, setOpened] = useState(false);
  const sortedTasks = _.orderBy(tasks, (task) => new Date(task.deadline), ['desc']);
  const icon = {
    ToDo: '🚧',
    InProgress: '⚒️',
    Done: '🚀',
    Backlog: '🚨'
  }
  return (
    <Paper shadow="xs" radius="md" p="md" sx={{ minWidth: 350 }}>
      <Stack>
        <Title order={3}>{icon[category]} {category}</Title>
        {sortedTasks.map(task => <Task task={task} key={task.id} />)}
        {sortedTasks.length == 0 && <Text>No tasks!</Text>}
        <Button variant="outline" onClick={() => setOpened(true)}>New Task</Button>
        <NewTaskModal category={category} opened={opened} setOpened={setOpened} />
      </Stack>
    </Paper>
  )
}

function NewTaskModal({ opened, setOpened, category }) {
  return (
    <Modal
      opened={opened}
      onClose={() => setOpened(false)}
      title={<Title>Create new Task in {category}</Title>}
    >
      <Form method="POST">
        <Stack>
          <Textarea name="description" label="Description" required />
          <input type="hidden" name="category" value={category} />
          <DatePicker name="deadline" placeholder="Pick date" label="Deadline" required />
          <Button type="submit">Add task</Button>
        </Stack>
      </Form>
    </Modal>
  )
}

function Task({ task }) {
  const [opened, setOpened] = useState(false);
  const colors = (theme) => ({
    background: ({
      ToDo: isBacklog(task) ? theme.colors.red[0] : theme.colors.yellow[0],
      InProgress: theme.colors.blue[0],
      Done: theme.colors.green[0]
    })[task.category]
  })
  return (
    <Paper sx={colors} shadow="0" radius="md" p="md" onClick={() => setOpened(true)}>
      <Text size="lg">{task.description}</Text>
      <Text color="dimmed">Due {new Date(task.deadline).toLocaleDateString('en-IN')}</Text>
      <EditTaskModal task={task} opened={opened} setOpened={setOpened} />
    </Paper>
  )
}

function EditTaskModal({ opened, setOpened, task }) {
  const [description, setDescription] = useState(task.description);
  const [category, setCategory] = useState(task.category);
  const [deadline, setDeadline] = useState(new Date(task.deadline));
  return (
    <Modal
      opened={opened}
      onClose={() => setOpened(false)}
      title={<Title>Edit Task</Title >}
    >
      <Stack>
        <Textarea form="update_form" name="description" label="Description" value={description} onChange={(e) => setDescription(e.currentTarget.value)} />
        {/* Fix for bug mantine#1137 */}
        <input type="hidden" form="update_form" name="category" value={category} />
        <Select label="Category" data={_.keys(CATEGORIES)} value={category} onChange={setCategory} />
        <DatePicker form="update_form" name="deadline" placeholder="Pick date" label="Deadline" value={deadline} onChange={setDeadline} />
        <Group position="right">
          <Form method="DELETE">
            <input type="hidden" name="task_id" value={task.id} />
            <Button type="submit" variant="subtle" color="red">
              Delete
            </Button>
          </Form>
          <Form method="PATCH" id="update_form">
            <input type="hidden" name="task_id" value={task.id} />
            <Button type="submit" variant="subtle" color="green">
              Update
            </Button>
          </Form>
        </Group>
      </Stack>
    </Modal>
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
    const description = form.get('description');
    const category = form.get('category');
    const deadline = new Date(form.get('deadline'));
    const task = await db.task.create({
      data: {
        description, category, deadline,
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
  } else if (request.method === 'PATCH') {
    const taskId = form.get("task_id");
    const description = form.get('description');
    const category = form.get('category');
    const deadline = new Date(form.get('deadline'));
    const task = await db.task.update({
      data: {
        description, category, deadline
      },
      where: { id: taskId },
    })
    return json({});
  }
}
