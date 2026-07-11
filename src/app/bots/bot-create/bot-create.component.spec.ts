import { BotCreateComponent } from './bot-create.component';

describe('BotCreateComponent', () => {
  const createComponent = (name: string): BotCreateComponent => {
    const component = Object.create(BotCreateComponent.prototype) as BotCreateComponent;
    component.botType = 'tilebot';
    component.faqKbName = name;
    return component;
  };

  it('requires at least two non-space characters for a tilebot name', () => {
    expect(createComponent(' A ').isTilebotNameValid).toBeFalsy();
    expect(createComponent(' Atendimento ').isTilebotNameValid).toBeTruthy();
  });

  it('marks an invalid tilebot name inline while typing', () => {
    const component = createComponent('A');

    component.botNameChanged('A');
    expect(component.tilebotNameHasError).toBeTruthy();

    component.faqKbName = 'Atendimento';
    component.botNameChanged('Atendimento');
    expect(component.tilebotNameHasError).toBeFalsy();
  });
});
