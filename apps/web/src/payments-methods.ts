export type PortalPaymentMethodAvailability = "available" | "planned";

export type PortalPaymentMethod = {
  key: string;
  label: string;
  provider: string;
  availability: PortalPaymentMethodAvailability;
  badge: string;
  description: string;
  instructionTitle: string;
  instructions: string[];
  integrationModel: "instant" | "async";
  supportedCurrencies: string[];
  submitLabel: string;
  helperText: string;
};

export const DEPOSIT_METHODS: PortalPaymentMethod[] = [
  {
    key: "manual_mock",
    label: "Ambiente local",
    provider: "manual",
    availability: "available",
    badge: "Disponivel agora",
    description:
      "Completa o deposito imediatamente para acelerar testes de carteira, trading e portfolio sem depender de integracao externa.",
    instructionTitle: "Fluxo manual de desenvolvimento",
    instructions: [
      "O valor enviado entra direto na carteira disponivel.",
      "Use a chave de idempotencia para evitar duplicidade acidental.",
      "Esta trilha sera reaproveitada no futuro para PIX, QR Code ou checkout externo.",
    ],
    integrationModel: "instant",
    supportedCurrencies: ["USD"],
    submitLabel: "Confirmar deposito",
    helperText: "O deposito sera refletido imediatamente na carteira neste ambiente.",
  },
  {
    key: "pix",
    label: "PIX",
    provider: "pix_gateway",
    availability: "planned",
    badge: "Em breve",
    description:
      "Vai suportar criacao de cobranca, QR Code e acompanhamento do status do pagamento ate a compensacao na carteira.",
    instructionTitle: "Fluxo futuro com PIX",
    instructions: [
      "A criacao do deposito vai retornar instrucoes como QR Code, copia e cola ou referencia de cobranca.",
      "O credito na carteira sera assincrono e ocorrera apos confirmacao do provedor ou webhook.",
      "A mesma tela podera mostrar status como pending, processing e completed sem mudar a navegacao.",
    ],
    integrationModel: "async",
    supportedCurrencies: ["BRL"],
    submitLabel: "PIX em breve",
    helperText: "Esta opcao sera habilitada quando o provedor de PIX estiver integrado.",
  },
  {
    key: "provider_checkout",
    label: "Checkout externo",
    provider: "cash_in_partner",
    availability: "planned",
    badge: "Planejado",
    description:
      "Prepara o portal para redirecionamento a parceiros de cash-in com conciliacao posterior dentro da trilha de movimentacoes.",
    instructionTitle: "Fluxo futuro com checkout externo",
    instructions: [
      "O portal podera criar uma intencao de deposito e abrir um checkout do provedor.",
      "O status sera atualizado de forma assincrona quando o parceiro concluir ou rejeitar a operacao.",
      "O historico financeiro mostrara provedor, referencia externa e resultado final do cash-in.",
    ],
    integrationModel: "async",
    supportedCurrencies: ["USD", "BRL"],
    submitLabel: "Checkout em breve",
    helperText: "Esta opcao sera usada quando a plataforma integrar parceiros externos de cash-in.",
  },
];

export const WITHDRAW_METHODS: PortalPaymentMethod[] = [
  {
    key: "manual_mock",
    label: "Ambiente local",
    provider: "manual",
    availability: "available",
    badge: "Disponivel agora",
    description:
      "Executa o saque imediatamente no ambiente de desenvolvimento para testar risco, saldo disponivel e reflexo na carteira sem depender de um parceiro externo.",
    instructionTitle: "Fluxo local de retirada",
    instructions: [
      "Somente o saldo disponivel pode ser retirado.",
      "Ordens abertas mantem parte do capital em reservado e esse valor nao sai da carteira.",
      "Limites simples de risco e status da conta podem bloquear a solicitacao.",
    ],
    integrationModel: "instant",
    supportedCurrencies: ["USD"],
    submitLabel: "Solicitar saque",
    helperText: "Saque sujeito a saldo, status da conta e limites configurados.",
  },
  {
    key: "pix_cashout",
    label: "PIX cash-out",
    provider: "pix_payout",
    availability: "planned",
    badge: "Em breve",
    description:
      "Vai permitir retirar saldo para uma chave PIX com validacao de titularidade, status do payout e rastreio no historico financeiro.",
    instructionTitle: "Fluxo futuro com saque via PIX",
    instructions: [
      "O usuario informara uma chave PIX ou selecionara uma conta previamente validada.",
      "A retirada podera passar por validacoes adicionais antes do envio ao provedor.",
      "O historico mostrara estados assincronos como pending, processing, completed ou failed.",
    ],
    integrationModel: "async",
    supportedCurrencies: ["BRL"],
    submitLabel: "PIX cash-out em breve",
    helperText: "Esta opcao sera habilitada quando o provedor de cash-out estiver integrado.",
  },
  {
    key: "bank_transfer",
    label: "Transferencia bancaria",
    provider: "bank_payout_partner",
    availability: "planned",
    badge: "Planejado",
    description:
      "Prepara a experiencia para retiradas por conta bancaria com conciliacao, prazo de liquidacao e retorno do parceiro.",
    instructionTitle: "Fluxo futuro com transferencia bancaria",
    instructions: [
      "A retirada podera exigir conta validada e etapa adicional de compliance antes do envio.",
      "A confirmacao do cash-out pode levar mais tempo que o fluxo local e sera refletida por status.",
      "A mesma trilha de saque suportara dados do provedor sem exigir nova navegacao do usuario.",
    ],
    integrationModel: "async",
    supportedCurrencies: ["USD", "BRL"],
    submitLabel: "Transferencia em breve",
    helperText: "Esta opcao sera usada quando parceiros de payout estiverem ativos na plataforma.",
  },
];

export const getAvailablePaymentMethod = (methods: PortalPaymentMethod[]) =>
  methods.find((method) => method.availability === "available") ?? methods[0];
