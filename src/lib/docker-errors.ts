// Traduz stderr cru do Docker pra mensagens claras em pt-BR.
//
// Padroes baseados em erros reais que aparecem ao deployar stacks
// novas: porta em uso, rede ausente, imagem 404, swarm nao iniciado,
// volume orfao, certificate signed by unknown authority.
//
// O retorno eh string formatada (pode ter \n) pronta pra console.error.
// Quando nao casa nenhum padrao, retorna o stderr cru mesmo — sempre
// melhor mostrar o erro original do que esconder.

export interface DockerErrorContext {
  command: string // ex: "docker stack deploy"
  stack?: string  // nome da stack sendo deployada
  stderr: string
  stdout?: string
  code: number
}

export function translateDockerError(ctx: DockerErrorContext): string {
  const e = ctx.stderr + "\n" + (ctx.stdout ?? "")

  // Porta 80/443/etc ja em uso
  const portMatch = e.match(/(?:bind|listen).*?(?:address already in use|port is already allocated).*?:(\d+)/i)
    ?? e.match(/port (\d+) is already in use/i)
    ?? e.match(/Bind for 0\.0\.0\.0:(\d+) failed: port is already allocated/i)
  if (portMatch) {
    const port = portMatch[1]
    return [
      `Porta ${port} ja esta em uso no servidor.`,
      `Isso geralmente acontece quando:`,
      `  - outro container/service ja escuta nessa porta`,
      `  - nginx/apache/caddy do sistema esta rodando`,
      ``,
      `Investigar: sudo lsof -i :${port}   ou   sudo ss -tlnp | grep ${port}`,
      `Resolver: parar o processo conflitante OU mudar a porta exposta da stack.`,
    ].join("\n")
  }

  // Rede overlay nao existe (typo ou aurora init nao rodou)
  const netMatch = e.match(/network ([\w_-]+) not found/i)
  if (netMatch) {
    return [
      `Rede Docker "${netMatch[1]}" nao existe.`,
      ``,
      `Causa provavel: aurora init nao rodou OU foi criado com nome diferente.`,
      `Verificar: docker network ls | grep ${netMatch[1]}`,
      `Resolver: rode \`aurora init\` (cria a rede com o nome configurado) OU \`docker network create -d overlay --attachable ${netMatch[1]}\`.`,
    ].join("\n")
  }

  // Imagem nao encontrada (typo no template, image:tag invalida)
  const imgMatch = e.match(/(?:manifest unknown|repository .+ not found|pull access denied|image .+ not found)/i)
  if (imgMatch) {
    return [
      `Imagem Docker nao encontrada ou sem acesso.`,
      ``,
      `Causas comuns:`,
      `  - tag invalida no template (ex: postgres:99 nao existe)`,
      `  - imagem privada sem login (docker login)`,
      `  - typo no nome da imagem`,
      ``,
      `Erro original:`,
      ctx.stderr.trim() || ctx.stdout?.trim() || "(sem detalhes)",
    ].join("\n")
  }

  // Swarm nao iniciado
  if (/this node is not a swarm manager/i.test(e) || /swarm not initialized/i.test(e)) {
    return [
      `Docker Swarm nao esta ativo neste node.`,
      ``,
      `Resolver: rode \`aurora init\` (verifica e inicia Swarm automaticamente)`,
      `OU manualmente: docker swarm init`,
    ].join("\n")
  }

  // Sem permissao (nao eh root)
  if (/permission denied|connect: permission denied|Got permission denied while trying to connect/i.test(e)) {
    return [
      `Sem permissao pra falar com o Docker daemon.`,
      ``,
      `Causa: voce nao eh root nem esta no grupo "docker".`,
      `Resolver: rode com sudo OU adicione seu user ao grupo docker:`,
      `  sudo usermod -aG docker $USER && newgrp docker`,
    ].join("\n")
  }

  // Daemon offline
  if (/Cannot connect to the Docker daemon|Is the docker daemon running\?/i.test(e)) {
    return [
      `Nao consegui falar com o Docker daemon.`,
      ``,
      `Verificar: systemctl status docker`,
      `Resolver: sudo systemctl start docker`,
    ].join("\n")
  }

  // Compose YAML mal formado (raro com nosso renderer, mas possivel)
  if (/yaml: line \d+/i.test(e) || /Additional property .+ is not allowed/i.test(e)) {
    return [
      `Arquivo compose gerado tem problema de sintaxe.`,
      ``,
      `Isso eh um bug do template Aurora — abra issue em github.com/adeiltonpessini/aurora-stack/issues.`,
      ``,
      `Erro original:`,
      ctx.stderr.trim(),
    ].join("\n")
  }

  // Fallback: erro original cru (sempre melhor que silenciar)
  return [
    `Comando "${ctx.command}" falhou (exit code ${ctx.code}).`,
    ``,
    `Saida:`,
    (ctx.stderr.trim() || ctx.stdout?.trim() || "(stderr e stdout vazios)").split("\n").map((l) => "  " + l).join("\n"),
  ].join("\n")
}
