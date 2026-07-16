import { AbstractControl } from '@angular/forms';

const BCRYPT_MAX_PASSWORD_BYTES = 72;
const MIN_PASSWORD_CHARACTERS = 8;
const MAX_PASSWORD_CHARACTERS = 72;

export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value || '').length;
}

export function unicodeCharacterLength(value: string): number {
  return Array.from(value || '').length;
}

export function unicodePasswordLength(control: AbstractControl): { [key: string]: boolean } | null {
  const length = unicodeCharacterLength(control.value);
  if (length < MIN_PASSWORD_CHARACTERS) {
    return { minlength: true };
  }
  return length <= MAX_PASSWORD_CHARACTERS ? null : { maxlength: true };
}

export function bcryptPasswordByteLimit(control: AbstractControl): { [key: string]: boolean } | null {
  return utf8ByteLength(control.value) <= BCRYPT_MAX_PASSWORD_BYTES
    ? null
    : { bcryptmaxlength: true };
}
