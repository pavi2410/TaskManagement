import {
  TextInput,
  PasswordInput,
  Checkbox,
  Anchor,
  Paper,
  Title,
  Text,
  Container,
  Group,
  Button,
} from '@mantine/core';
import { useMemo } from 'react';
import { Form, json, Link, useActionData, useSearchParams } from 'remix';

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
        Do not have an account yet?{' '}
        <Anchor as="a" href={"/signup" + redirect} size="sm">
          Create account
        </Anchor>
      </Text>

      <Paper withBorder shadow="md" padding={30} mt={30} radius="md">
        {actionData && JSON.stringify(actionData)}
        <Form method="POST">
          <input
            type="hidden"
            name="redirectTo"
            value={searchParams.get("redirectTo") ?? undefined}
          />
          <TextInput label="Email" placeholder="you@taskmate.com" required />
          <PasswordInput label="Password" placeholder="Your password" required mt="md" />
          <Button fullWidth mt="xl" type="submit">
            Sign in
          </Button>
        </Form>
      </Paper >
    </Container>
  );
}

export const action = async ({ request }) => {
  const form = await request.formData();
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

  const user = await login({ username, password });
  if (!user) {
    return badRequest({
      fields,
      formError: `Username/Password combination is incorrect`,
    });
  }
  return createUserSession(user.id, redirectTo);
}

const badRequest = (data) => json(data, { status: 400 });

function validateUsername(username) {
  if (typeof username !== "string" || username.length < 3) {
    return `Usernames must be at least 3 characters long`;
  }
}

function validatePassword(password) {
  if (typeof password !== "string" || password.length < 6) {
    return `Passwords must be at least 6 characters long`;
  }
}