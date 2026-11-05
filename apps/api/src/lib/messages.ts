/** Textos de e-mails e notificações (pt/en). */
type Locale = 'pt' | 'en' | 'es'
type Vars = Record<string, string | number>

const dict = {
  'email.verify.subject': { pt: 'Confirme seu e-mail — Amazon Trade', en: 'Confirm your e-mail — Amazon Trade' , es: 'Confirma tu correo — Amazon Trade' },
  'email.verify.body': {
    pt: 'Olá {name},\n\nConfirme seu e-mail para ativar sua conta na Amazon Trade:\n{link}\n\nO link vale por 48 horas.',
    en: 'Hello {name},\n\nConfirm your e-mail to activate your Amazon Trade account:\n{link}\n\nThis link is valid for 48 hours.',
    es: 'Hola {name},\n\nConfirma tu correo para activar tu cuenta en Amazon Trade:\n{link}\n\nEl enlace es válido por 48 horas.',
  },
  'email.reset.subject': { pt: 'Redefinição de senha — Amazon Trade', en: 'Password reset — Amazon Trade' , es: 'Restablecer contraseña — Amazon Trade' },
  'email.reset.body': {
    pt: 'Olá {name},\n\nPara redefinir sua senha acesse:\n{link}\n\nO link vale por 1 hora. Se não foi você, ignore este e-mail.',
    en: 'Hello {name},\n\nTo reset your password open:\n{link}\n\nThis link is valid for 1 hour. If this was not you, ignore this e-mail.',
    es: 'Hola {name},\n\nPara restablecer tu contraseña abre:\n{link}\n\nEl enlace es válido por 1 hora. Si no fuiste tú, ignora este correo.',
  },
  'email.invite.subject': { pt: 'Você foi convidado para a Amazon Trade', en: 'You have been invited to Amazon Trade' , es: 'Has sido invitado a Amazon Trade' },
  'email.invite.body': {
    pt: 'Olá {name},\n\n{inviter} convidou você para a conta da empresa {company}. Defina sua senha em:\n{link}',
    en: 'Hello {name},\n\n{inviter} invited you to the {company} account. Set your password at:\n{link}',
    es: 'Hola {name},\n\n{inviter} te invitó a la cuenta de la empresa {company}. Define tu contraseña en:\n{link}',
  },
  'notif.onboarding.submitted': { pt: 'Cadastro enviado para análise', en: 'Registration submitted for review' , es: 'Registro enviado para revisión' },
  'notif.onboarding.submitted.body': { pt: '{company} enviou o cadastro para análise de compliance.', en: '{company} submitted its registration for compliance review.' , es: '{company} envió su registro para revisión de cumplimiento.' },
  'notif.onboarding.updated': { pt: 'Cadastro atualizado após aprovação', en: 'Registration updated after approval' , es: 'Registro actualizado tras la aprobación' },
  'notif.onboarding.updated.body': { pt: '{company} alterou dados/documentos do cadastro. Revise quando possível.', en: '{company} changed registration data/documents. Please review.' , es: '{company} modificó datos/documentos del registro. Revisa cuando sea posible.' },
  'notif.onboarding.approved': { pt: 'Cadastro aprovado', en: 'Registration approved' , es: 'Registro aprobado' },
  'notif.onboarding.approved.body': { pt: 'Sua empresa foi aprovada. Você já pode operar na plataforma.', en: 'Your company has been approved. You can now operate on the platform.' , es: 'Tu empresa fue aprobada. Ya puedes operar en la plataforma.' },
  'notif.onboarding.rejected': { pt: 'Cadastro reprovado', en: 'Registration rejected' , es: 'Registro rechazado' },
  'notif.onboarding.changes': { pt: 'Ajustes necessários no cadastro', en: 'Changes required in your registration' , es: 'Se requieren ajustes en tu registro' },
  'notif.document.rejected': { pt: 'Documento reprovado', en: 'Document rejected' , es: 'Documento rechazado' },
  'notif.document.rejected.body': { pt: 'O documento "{doc}" foi reprovado: {reason}', en: 'Document "{doc}" was rejected: {reason}' , es: 'El documento "{doc}" fue rechazado: {reason}' },
  'notif.order.created': { pt: 'Novo pedido recebido', en: 'New order received' , es: 'Nuevo pedido recibido' },
  'notif.order.created.body': { pt: 'Pedido {number} de {company}: {qty} kg de {product}. Aceite ou recuse.', en: 'Order {number} from {company}: {qty} kg of {product}. Accept or decline.' , es: 'Pedido {number} de {company}: {qty} kg de {product}. Acepta o rechaza.' },
  'notif.order.confirmed': { pt: 'Pedido confirmado', en: 'Order confirmed' , es: 'Pedido confirmado' },
  'notif.order.confirmed.body': { pt: 'O pedido {number} foi confirmado e o embarque foi iniciado.', en: 'Order {number} was confirmed and the shipment has started.' , es: 'El pedido {number} fue confirmado y el embarque comenzó.' },
  'notif.order.rejected': { pt: 'Pedido recusado', en: 'Order declined' , es: 'Pedido rechazado' },
  'notif.order.rejected.body': { pt: 'O pedido {number} foi recusado: {reason}', en: 'Order {number} was declined: {reason}' , es: 'El pedido {number} fue rechazado: {reason}' },
  'notif.shipment.stage': { pt: 'Embarque avançou de etapa', en: 'Shipment moved to the next stage' , es: 'El embarque avanzó de etapa' },
  'notif.shipment.stage.body': { pt: 'O embarque {number} agora está em "{stage}".', en: 'Shipment {number} is now at "{stage}".' , es: 'El embarque {number} ahora está en "{stage}".' },
  'notif.shipment.exception': { pt: 'Ocorrência no embarque', en: 'Shipment exception' , es: 'Incidencia en el embarque' },
  'notif.shipment.exception.body': { pt: 'O embarque {number} entrou em "{stage}": {reason}', en: 'Shipment {number} moved to "{stage}": {reason}' , es: 'El embarque {number} pasó a "{stage}": {reason}' },
  'notif.integration.dead': { pt: 'Integração falhou definitivamente', en: 'Integration permanently failed' , es: 'La integración falló definitivamente' },
  'notif.integration.dead.body': { pt: 'A operação {operation} com {partner} esgotou as tentativas. Verifique no backoffice.', en: 'Operation {operation} with {partner} exhausted retries. Check the backoffice.' , es: 'La operación {operation} con {partner} agotó los reintentos. Revisa el backoffice.' },
  'notif.partner.update': { pt: 'Atualização de parceiro', en: 'Partner update' , es: 'Actualización de socio' },
} as const

export type MessageKey = keyof typeof dict

export function msg(locale: Locale, key: MessageKey, vars: Vars = {}): string {
  const entry = dict[key] as { pt: string; en: string; es?: string }
  const text = entry[locale] ?? (locale === 'es' ? entry.en : entry.pt)
  return text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''))
}
