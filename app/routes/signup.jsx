import { TextInput, PasswordInput, Anchor, Paper, Title, Text, Container, Button } from '@mantine/core';
import { useMemo } from 'react';
import { Form, json, useActionData, useSearchParams } from 'remix';
import { db } from '~/utils/db.server';
import { createUserSession, register } from '~/utils/session.server';
import { validateUsername, validatePassword } from '~/utils/validations.server'

export default function () {
  const actionData = useActionData();
  const [searchParams] = useSearchParams();

  let redirect = useMemo(() => {
    if (searchParams.get("redirectTo")) {
      return "?redirectTo=" + searchParams.get("redirectTo");
    }
    return ""
  }, [searchParams]);

  return (
    <Container size={420} my={40}>
      <Title
        align="center"
        sx={(theme) => ({ fontFamily: `Greycliff CF, ${theme.fontFamily}`, fontWeight: 900 })}
      >
        Welcome!
      </Title>
      <Text color="dimmed" size="sm" align="center" mt={5}>
        Already have an account?{' '}
        <Anchor as="a" href={"/login" + redirect} size="sm">
          Log in
        </Anchor>
      </Text>

      <Paper withBorder shadow="md" padding={30} mt={30} radius="md">
        {actionData && JSON.stringify(actionData)}
        <Form method="POST">
          <input
            type="hidden"
            name="redirectTo"
            value={searchParams.get("redirectTo") ?? "/tasks"}
          />
          <TextInput name="username" label="Email" placeholder="you@taskmate.com" required />
          <PasswordInput name="password" label="Password" placeholder="Your password" required mt="md" />
          <Button fullWidth mt="xl" type="submit">
            Create account
          </Button>
        </Form>
      </Paper >
    </Container>
  );
}

export const action = async ({ request }) => {
  const form = await request.formData();
  console.log(form)
  const username = form.get("username");
  const password = form.get("password");
  const redirectTo = form.get("redirectTo") || "/tasks";
  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    typeof redirectTo !== "string"
  ) {
    return badRequest({ formError: `Form not submitted correctly.` });
  }

  const fields = { username, password };
  const fieldErrors = {
    username: validateUsername(username),
    password: validatePassword(password),
  };
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fieldErrors, fields });
  }

  const userExists = await db.user.findFirst({ where: { username } });
  if (userExists) {
    return badRequest({
      fields,
      formError: `User with username ${username} already exists`,
    });
  }
  const user = await register({ username, password });
  if (!user) {
    return badRequest({
      fields,
      formError: `Something went wrong trying to create a new user.`,
    });
  }
  return createUserSession(user.id, redirectTo);
}

const badRequest = (data) => json(data, { status: 400 });
