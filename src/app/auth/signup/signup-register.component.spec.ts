import { FormBuilder } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { of, throwError } from 'rxjs';
import { SignupComponent } from './signup.component';

function createRegisterComponent(): any {
  const component = Object.create(SignupComponent.prototype) as any;
  component.isRegisterRoute = true;
  component.formErrors = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    terms: ''
  };
  component.validationMessages = {
    email: { required: 'Informe seu e-mail.', pattern: 'Informe um e-mail valido.' },
    password: {
      required: 'Informe sua senha.',
      minlength: 'A senha deve ter pelo menos 8 caracteres.',
      maxlength: 'A senha deve ter no maximo 72 caracteres.'
    },
    firstName: { required: 'Informe seu nome.' },
    lastName: {},
    terms: {}
  };
  component.fb = new FormBuilder();
  component.auth = jasmine.createSpyObj('AuthService', [
    'showExpiredSessionPopup',
    'signup',
    'signin',
    'projectSelected'
  ]);
  component.router = jasmine.createSpyObj('Router', ['navigate']);
  component.notify = jasmine.createSpyObj('NotifyService', ['showToast']);
  component.appConfigService = { getConfig: () => ({ SERVER_BASE_URL: 'https://api.test/' }) };
  component.logger = jasmine.createSpyObj('LoggerService', ['log', 'error']);
  component.localDbService = jasmine.createSpyObj('LocalDbService', ['removeFromStorage']);
  component.projectService = jasmine.createSpyObj('ProjectService', ['createProject', 'newProjectCreated']);
  component.titleCasePipe = new TitleCasePipe();
  component.buildForm();
  return component;
}

describe('SignupComponent register flow', () => {
  it('validates name and password with only the 8 to 72 character limits', () => {
    const component = createRegisterComponent();
    const password = REDACTED_SECRET('password');

    expect(component.userForm.get('firstName').hasError('required')).toBe(true);
    password.setValue('short');
    expect(password.hasError('minlength')).toBe(true);
    password.setValue('a'.repeat(73));
    expect(password.hasError('maxlength')).toBe(true);
    password.setValue('😀'.repeat(4));
    expect(password.hasError('minlength')).toBe(true);
    password.setValue('😀'.repeat(20));
    expect(password.hasError('bcryptmaxlength')).toBe(true);
    password.setValue('senha simples');
    expect(password.valid).toBe(true);
  });

  it('ignores a concurrent signup submission while one is in progress', () => {
    const component = createRegisterComponent();
    component.showSpinnerInLoginBtn = true;

    component.signUp();

    expect(component.auth.signup).not.toHaveBeenCalled();
    expect(component.projectService.createProject).not.toHaveBeenCalled();
  });

  it('creates the signup workspace and redirects to its home', () => {
    const component = createRegisterComponent();
    component.userForm.patchValue({
      firstName: 'Maria da Silva',
      email: 'redacted@example.invalid',
      password: 'senha simples',
      terms: true
    });
    component.auth.signup.and.returnValue(of({
      success: true,
      user: { email: 'redacted@example.invalid' }
    }));
    component.auth.signin.and.callFake((_email, _password, _baseUrl, callback) => callback(null, {}));
    component.projectService.createProject.and.returnValue(of({ _id: 'project-1' }));

    component.signup();

    expect(component.auth.signup).toHaveBeenCalledWith(
      'redacted@example.invalid',
      'senha simples',
      'Maria da Silva',
      '',
      undefined
    );
    expect(component.projectService.createProject).toHaveBeenCalledWith('Maria da Silva', 'signup');
    expect(component.auth.projectSelected).toHaveBeenCalledWith({ _id: 'project-1' }, 'workspace-name');
    expect(component.router.navigate).toHaveBeenCalledWith(['/project/project-1/home']);

    const logs = component.logger.log.calls.allArgs().concat(component.logger.error.calls.allArgs()).join(' ');
    expect(logs).not.toContain('senha simples');
  });

  it('retries only workspace creation after the account already exists', () => {
    const component = createRegisterComponent();
    component.userForm.patchValue({
      firstName: 'Maria da Silva',
      email: 'redacted@example.invalid',
      password: 'senha simples',
      terms: true
    });
    component.auth.signup.and.returnValue(of({
      success: true,
      user: { email: 'redacted@example.invalid' }
    }));
    component.auth.signin.and.callFake((_email, _password, _baseUrl, callback) => callback(null, {}));
    component.projectService.createProject.and.returnValues(
      throwError({ status: 500 }),
      of({ _id: 'project-retry' })
    );

    component.signup();
    component.signup();

    expect(component.auth.signup).toHaveBeenCalledTimes(1);
    expect(component.projectService.createProject).toHaveBeenCalledTimes(2);
    expect(component.router.navigate).toHaveBeenCalledWith(['/project/project-retry/home']);
  });
});
