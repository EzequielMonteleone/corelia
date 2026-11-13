import {fireEvent, render} from '@testing-library/react-native';
import {LoginForm} from '@/components/auth/LoginForm';

describe('LoginForm', () => {
  it('validates email and password before submitting', async () => {
    const onSubmit = jest.fn();
    const screen = await render(
      <LoginForm pending={false} onSubmit={onSubmit} />,
    );

    await fireEvent.changeText(
      screen.getByTestId('login-email'),
      'not-an-email',
    );
    await fireEvent.changeText(screen.getByTestId('login-password'), '123');
    await fireEvent.press(screen.getByTestId('login-submit'));

    expect(screen.getByText('Email inválido')).toBeTruthy();
    expect(
      screen.getByText('La contraseña debe tener al menos 6 caracteres'),
    ).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits trimmed credentials when the form is valid', async () => {
    const onSubmit = jest.fn();
    const screen = await render(
      <LoginForm pending={false} onSubmit={onSubmit} />,
    );

    await fireEvent.changeText(
      screen.getByTestId('login-email'),
      '  admin@corelia.com  ',
    );
    await fireEvent.changeText(
      screen.getByTestId('login-password'),
      'secret123',
    );
    await fireEvent.press(screen.getByTestId('login-submit'));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'admin@corelia.com',
      password: 'secret123',
    });
  });

  it('shows the server error banner', async () => {
    const screen = await render(
      <LoginForm
        pending={false}
        error="Email o contraseña incorrectos."
        onSubmit={jest.fn()}
      />,
    );

    expect(screen.getByText('Email o contraseña incorrectos.')).toBeTruthy();
  });
});
