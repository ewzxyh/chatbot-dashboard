import { EventEmitter } from '@angular/core';
import { ModalUnansweredQuestionsComponent } from './modal-unanswered-questions.component';

describe('ModalUnansweredQuestionsComponent', () => {
  it('opens a conversation only through the dedicated action', () => {
    const component = Object.assign(Object.create(ModalUnansweredQuestionsComponent.prototype), {
      listMode: 'unanswered',
      openConversation: new EventEmitter<{ requestId: string; listMode: 'answered' | 'unanswered' }>(),
    }) as ModalUnansweredQuestionsComponent;
    const emit = spyOn(component.openConversation, 'emit');

    component.openQuestionConversation({
      id: 'question-1',
      _id: 'question-1',
      question: 'How do I reset my password?',
      request_id: 'request-1',
    });

    expect(emit).toHaveBeenCalledWith({
      requestId: 'request-1',
      listMode: 'unanswered',
    });
  });

  it('does not emit without a conversation request id', () => {
    const component = Object.assign(Object.create(ModalUnansweredQuestionsComponent.prototype), {
      listMode: 'answered',
      openConversation: new EventEmitter<{ requestId: string; listMode: 'answered' | 'unanswered' }>(),
    }) as ModalUnansweredQuestionsComponent;
    const emit = spyOn(component.openConversation, 'emit');

    component.openQuestionConversation({
      id: 'question-1',
      question: 'Question without conversation',
    });

    expect(emit).not.toHaveBeenCalled();
  });
});
