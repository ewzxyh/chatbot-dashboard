const COMMON_REPLACEMENT_FIXES: { [key: string]: string } = {
  'Jo�o': 'João',
  'jo�o': 'joão',
  'S�o': 'São',
  's�o': 'são',
  'N�o': 'Não',
  'n�o': 'não',
  'a��o': 'ação',
  'A��o': 'Ação',
  'p�gina': 'página',
  'P�gina': 'Página'
};

export function formatAdminText(value: any): string {
  if (value === null || value === undefined) return '';
  let text = String(value);
  Object.keys(COMMON_REPLACEMENT_FIXES).forEach((key) => {
    text = text.split(key).join(COMMON_REPLACEMENT_FIXES[key]);
  });
  return text;
}
