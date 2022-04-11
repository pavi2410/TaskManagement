import { TextInput, PasswordInput, Anchor, Paper, Title, Text, Container, Button } from '@mantine/core';
import { useMemo } from 'react';
import { json } from '@remix-run/node';
import { Form, useActionData, useSearchParams } from '@remix-run/react';
import { createUserSession, login } from '~/utils/session.server';
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
        Do not have an account yet?{' '}
        <Anchor as="a" href={"/signup" + redirect} size="sm">
          Create account
        </Anchor>
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {/* {actionData && JSON.stringify(actionData, null, 2)} */}
        {actionData?.formError && <Text color="red">{actionData.formError}</Text>}
        <Form method="POST">
          <input
            type="hidden"
            name="redirectTo"
            value={searchParams.get("redirectTo") ?? "/tasks"}
          />
          <TextInput name="email" type="email" label="Email" placeholder="you@taskmate.com" required error={actionData?.fieldErrors?.email?.details[0].message} />
          <PasswordInput name="password" label="Password" placeholder="Your password" required mt="md" error={actionData?.fieldErrors?.password?.details[0].message} />
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
  const email = form.get("email");
  const password = form.get("password");
  const redirectTo = form.get("redirectTo") || "/tasks";
  if (
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

  const user = await login({ email, password });
  if (!user) {
    return badRequest({
      formError: `Email/Password combination is incorrect`,
    });
  }
  return createUserSession(user.id, redirectTo);
}

const badRequest = (data) => json(data, { status: 400 });
