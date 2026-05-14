import os
import json
import urllib.request

API_KEY = os.getenv("OPENROUTER_API_KEY", "")
API_URL = "https://openrouter.ai/api/v1/chat/completions"

MODELS = [
    "poolside/laguna-m.1:free",
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    "liquid/lfm-2.5-1.2b-thinking:free",
    "liquid/lfm-2.5-1.2b-instruct:free",
    "poolside/laguna-xs.2:free",
    "inclusionai/ring-2.6-1t:free"
]

SYSTEM_PROMPT = """You are an expert Linux/Bash command generator running inside a terminal emulator.
The user wants to execute a task described in natural language.
You must return ONLY the exact Linux/Bash command or shell script that fulfills their request.
Rules:
1. DO NOT include markdown formatting (no ```bash or ```sh).
2. DO NOT include explanations — just the raw command.
3. Use standard Linux/Bash syntax (ls, mkdir, rm, grep, find, cat, echo, etc.).
4. If the user asks for a multi-step operation like "ask for permission first", generate a shell script
   using `read -p "..."` to prompt the user before taking action.
Example: files=$(ls S*); echo "$files"; read -p "Delete these? (y/n) " ans; [ "$ans" = "y" ] && rm S*
"""


class AIService:
    @staticmethod
    def translate_to_command(prompt: str) -> str:
        last_error = ""
        for model in MODELS:
            data = {
                "model": model,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ]
            }
            req = urllib.request.Request(
                API_URL,
                data=json.dumps(data).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {API_KEY}",
                    "Content-Type": "application/json"
                },
                method="POST"
            )
            try:
                with urllib.request.urlopen(req, timeout=15) as response:
                    response_json = json.loads(response.read().decode("utf-8"))
                    if "choices" in response_json and len(response_json["choices"]) > 0:
                        command = response_json["choices"][0]["message"]["content"].strip()
                        # Strip any accidental code fences
                        command = (
                            command
                            .removeprefix("```bash")
                            .removeprefix("```sh")
                            .removeprefix("```")
                            .removesuffix("```")
                            .strip()
                        )
                        return command
            except Exception as e:
                last_error = str(e)
                continue

        return f"echo 'AI Error: All models failed. Last: {last_error}'"


ai_service = AIService()
