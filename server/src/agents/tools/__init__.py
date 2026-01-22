"""Modulo de ferramentas do agente."""

# Mapeamento de nomes de ferramentas para exibicao amigavel ao usuario
TOOL_DISPLAY_NAMES: dict[str, str] = {
    "web_search": "Pesquisando na web",
    "web_fetch": "Acessando página",
}


def get_tool_display_name(tool_name: str) -> str:
    """Retorna nome amigavel da ferramenta para exibicao ao usuario."""
    return TOOL_DISPLAY_NAMES.get(tool_name, f"Executando {tool_name}")
