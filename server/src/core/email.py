"""Serviço de email usando Resend"""

import resend

from src.core.env import resend_api_key, resend_from_email, app_url


def send_verification_email(to_email: str, name: str, token: str) -> bool:
    """
    Envia email de verificação para o usuário.
    Retorna True se enviado com sucesso, False caso contrário.
    """
    verification_link = f"{app_url}/auth/verify-email?token={token}"

    # Em desenvolvimento sem API key, apenas loga o link
    if not resend_api_key:
        print(f"[DEV] Email de verificação para {to_email}")
        print(f"[DEV] Link: {verification_link}")
        return True

    resend.api_key = resend_api_key

    try:
        resend.Emails.send(
            {
                "from": resend_from_email,
                "to": to_email,
                "subject": "Verifique seu email - Pineai",
                "html": _get_verification_email_html(name, verification_link),
            }
        )
        return True
    except Exception as e:
        print(f"Erro ao enviar email de verificação: {e}")
        return False


def send_password_reset_email(to_email: str, name: str, token: str) -> bool:
    """
    Envia email de recuperação de senha.
    Retorna True se enviado com sucesso, False caso contrário.
    """
    reset_link = f"{app_url}/auth/reset-password?token={token}"

    # Em desenvolvimento sem API key, apenas loga o link
    if not resend_api_key:
        print(f"[DEV] Email de reset de senha para {to_email}")
        print(f"[DEV] Link: {reset_link}")
        return True

    resend.api_key = resend_api_key

    try:
        resend.Emails.send(
            {
                "from": resend_from_email,
                "to": to_email,
                "subject": "Recuperação de senha - Pineai",
                "html": _get_password_reset_email_html(name, reset_link),
            }
        )
        return True
    except Exception as e:
        print(f"Erro ao enviar email de reset: {e}")
        return False


def _get_password_reset_email_html(name: str, reset_link: str) -> str:
    """Retorna o HTML do email de recuperação de senha."""
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #18181b; font-size: 24px; font-weight: 600; margin: 0 0 8px 0;">
                Recuperação de Senha
            </h1>
            <p style="color: #71717a; font-size: 16px; line-height: 1.5; margin: 0 0 24px 0;">
                Olá {name}, recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:
            </p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="{reset_link}"
                   style="display: inline-block; background-color: #18181b; color: white; padding: 12px 32px;
                          text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
                    Redefinir Senha
                </a>
            </div>
            <p style="color: #a1a1aa; font-size: 14px; line-height: 1.5; margin: 24px 0 0 0;">
                Ou copie e cole este link no seu navegador:
            </p>
            <p style="color: #71717a; font-size: 14px; word-break: break-all; margin: 8px 0 24px 0;">
                <a href="{reset_link}" style="color: #3b82f6;">{reset_link}</a>
            </p>
            <div style="border-top: 1px solid #e4e4e7; margin-top: 32px; padding-top: 24px;">
                <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                    Este link expira em 1 hora. Se você não solicitou a recuperação de senha, ignore este email.
                </p>
            </div>
        </div>
        <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 24px;">
            Pineai - Inteligência Artificial para sua empresa
        </p>
    </div>
</body>
</html>
"""


def _get_verification_email_html(name: str, verification_link: str) -> str:
    """Retorna o HTML do email de verificação."""
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #18181b; font-size: 24px; font-weight: 600; margin: 0 0 8px 0;">
                Bem-vindo ao Pineai, {name}!
            </h1>
            <p style="color: #71717a; font-size: 16px; line-height: 1.5; margin: 0 0 24px 0;">
                Para completar seu cadastro, clique no botão abaixo para verificar seu email:
            </p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="{verification_link}"
                   style="display: inline-block; background-color: #18181b; color: white; padding: 12px 32px;
                          text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
                    Verificar Email
                </a>
            </div>
            <p style="color: #a1a1aa; font-size: 14px; line-height: 1.5; margin: 24px 0 0 0;">
                Ou copie e cole este link no seu navegador:
            </p>
            <p style="color: #71717a; font-size: 14px; word-break: break-all; margin: 8px 0 24px 0;">
                <a href="{verification_link}" style="color: #3b82f6;">{verification_link}</a>
            </p>
            <div style="border-top: 1px solid #e4e4e7; margin-top: 32px; padding-top: 24px;">
                <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                    Este link expira em 24 horas. Se você não criou uma conta no Pineai, ignore este email.
                </p>
            </div>
        </div>
        <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 24px;">
            Pineai - Inteligência Artificial para sua empresa
        </p>
    </div>
</body>
</html>
"""
