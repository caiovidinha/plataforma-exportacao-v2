/** Textos de e-mails e notificações (pt/en). */
type Locale = 'pt' | 'en'
type Vars = Record<string, string | number>

const dict = {
  'email.verify.subject': { pt: 'Confirme seu e-mail — Amazon Trade', en: 'Confirm your e-mail — Amazon Trade' },
  'email.verify.body': {
    pt: 'Olá {name},\n\nConfirme seu e-mail para ativar sua conta na Amazon Trade:\n{link}\n\nO link vale por 48 horas.',
    en: 'Hello {name},\n\nConfirm your e-mail to activate your Amazon Trade account:\n{link}\n\nThis link is valid for 48 hours.',
  },
  'email.reset.subject': { pt: 'Redefinição de senha — Amazon Trade', en: 'Password reset — Amazon Trade' },
  'email.reset.body': {
    pt: 'Olá {name},\n\nPara redefinir sua senha acesse:\n{link}\n\nO link vale por 1 hora. Se não foi você, ignore este e-mail.',
    en: 'Hello {name},\n\nTo reset your password open:\n{link}\n\nThis link is valid for 1 hour. If this was not you, ignore this e-mail.',
  },
  'email.invite.subject': { pt: 'Você foi convidado para a Amazon Trade', en: 'You have been invited to Amazon Trade' },
  'email.invite.body': {
    pt: 'Olá {name},\n\n{inviter} convidou você para a conta da empresa {company}. Defina sua senha em:\n{link}',
    en: 'Hello {name},\n\n{inviter} invited you to the {company} account. Set your password at:\n{link}',
  },
  'notif.onboarding.submitted': { pt: 'Cadastro enviado para análise', en: 'Registration submitted for review' },
  'notif.onboarding.submitted.body': { pt: '{company} enviou o cadastro para análise de compliance.', en: '{company} submitted its registration for compliance review.' },
  'notif.onboarding.approved': { pt: 'Cadastro aprovado', en: 'Registration approved' },
  'notif.onboarding.approved.body': { pt: 'Sua empresa foi aprovada. Você já pode operar na plataforma.', en: 'Your company has been approved. You can now operate on the platform.' },
  'notif.onboarding.rejected': { pt: 'Cadastro reprovado', en: 'Registration rejected' },
  'notif.onboarding.changes': { pt: 'Ajustes necessários no cadastro', en: 'Changes required in your registration' },
  'notif.document.rejected': { pt: 'Documento reprovado', en: 'Document rejected' },
  'notif.document.rejected.body': { pt: 'O documento "{doc}" foi reprovado: {reason}', en: 'Document "{doc}" was rejected: {reason}' },
  'notif.order.created': { pt: 'Novo pedido recebido', en: 'New order received' },
  'notif.order.created.body': { pt: 'Pedido {number} de {company}: {qty} kg de {product}. Aceite ou recuse.', en: 'Order {number} from {company}: {qty} kg of {product}. Accept or decline.' },
  'notif.order.confirmed': { pt: 'Pedido confirmado', en: 'Order confirmed' },
  'notif.order.confirmed.body': { pt: 'O pedido {number} foi confirmado e o embarque foi iniciado.', en: 'Order {number} was confirmed and the shipment has started.' },
  'notif.order.rejected': { pt: 'Pedido recusado', en: 'Order declined' },
  'notif.order.rejected.body': { pt: 'O pedido {number} foi recusado: {reason}', en: 'Order {number} was declined: {reason}' },
  'notif.shipment.stage': { pt: 'Embarque avançou de etapa', en: 'Shipment moved to the next stage' },
  'notif.shipment.stage.body': { pt: 'O embarque {number} agora está em "{stage}".', en: 'Shipment {number} is now at "{stage}".' },
  'notif.shipment.exception': { pt: 'Ocorrência no embarque', en: 'Shipment exception' },
  'notif.shipment.exception.body': { pt: 'O embarque {number} entrou em "{stage}": {reason}', en: 'Shipment {number} moved to "{stage}": {reason}' },
  'notif.integration.dead': { pt: 'Integração falhou definitivamente', en: 'Integration permanently failed' },
  'notif.integration.dead.body': { pt: 'A operação {operation} com {partner} esgotou as tentativas. Verifique no backoffice.', en: 'Operation {operation} with {partner} exhausted retries. Check the backoffice.' },
  'notif.partner.update': { pt: 'Atualização de parceiro', en: 'Partner update' },
} as const

export type MessageKey = keyof typeof dict

export function msg(locale: Locale, key: MessageKey, vars: Vars = {}): string {
  const text = dict[key][locale] ?? dict[key].pt
  return text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''))
}
