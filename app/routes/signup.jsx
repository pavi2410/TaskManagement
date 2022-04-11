import { TextInput, PasswordInput, Anchor, Paper, Title, Text, Container, Button } from '@mantine/core';
import { useMemo } from 'react';
import { json } from '@remix-run/node';
import { Form, useActionData, useSearchParams } from '@remix-run/react';
import { db } from '~/utils/db.server';
import { createUserSession, register } from '~/utils/session.server';
import { validateEmail, validatePassword } from '~/utils/validations.server'

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

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {/* {actionData && JSON.stringify(actionData)} */}
        {actionData?.formError && <Text color="red">{actionData.formError}</Text>}
        <Form method="POST">
          <input
            type="hidden"
            name="redirectTo"
            value={searchParams.get("redirectTo") ?? "/tasks"}
          />
          <TextInput name="name" label="Name" placeholder="Your name" required />
          <TextInput name="email" label="Email" placeholder="you@taskmate.com" required error={actionData?.fieldErrors?.email?.details[0].message} />
          <PasswordInput name="password" label="Password" placeholder="Your password" required mt="md" error={actionData?.fieldErrors?.password?.details[0].message} />
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
  const name = form.get("name");
  const email = form.get("email");
  const password = form.get("password");
  const redirectTo = form.get("redirectTo") || "/tasks";
  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof redirectTo !== "string"
  ) {
    return badRequest({ formError: `Form not submitted correctly.` });
  }

  const fieldErrors = {
    email: validateEmail(email),
    password: validatePassword(password),
  };
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fieldErrors });
  }

  const userExists = await db.user.findFirst({ where: { email } });
  if (userExists) {
    return badRequest({
      formError: `User with email ${email} already exists`,
    });
  }
  const user = await register({ email, password, name });
  if (!user) {
    return badRequest({
      formError: `Something went wrong trying to create a new user.`,
    });
  }
  return createUserSession(user.id, redirectTo);
}

const badRequest = (data) => json(data, { status: 400 });
