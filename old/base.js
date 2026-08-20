const BASE_CLASSES =
  "text-2xl font-bold w-full p-4 rounded shadow-md transition duration-200 ease-in-out cursor-pointer border-1 border-transparent";
const PRIMARY_BUTTON_CLASSES =
  "bg-green-500 text-white hover:bg-green-600 active:bg-green-700 shadow-green-500/50";
const SECONDARY_BUTTON_CLASSES =
  "bg-gray-300 text-gray-800 hover:bg-gray-400 active:bg-gray-500";

const ButtonComponent = (props, unoClasses, ...children) => {
  const finalClass =
    `${BASE_CLASSES} ${unoClasses} ${props.class || ""}`.trim();
  const { class: _, ...otherProps } = props;
  return van.tags.button({ ...otherProps, class: finalClass }, ...children);
};

const PrimaryButton = (props = {}, ...children) => {
  return ButtonComponent(props, PRIMARY_BUTTON_CLASSES, ...children);
};

const SecondaryButton = (props = {}, ...children) => {
  return ButtonComponent(props, SECONDARY_BUTTON_CLASSES, ...children);
};

const FORM_CONTROL_CLASSES =
  "text-xl w-full p-4 border border-gray-300 rounded-lg bg-white text-gray-900" +
  " focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" +
  " transition duration-150 ease-in-out";
const Input = (props = {}) => {
  const finalClass = `${FORM_CONTROL_CLASSES} ${props.class || ""}`.trim();
  const { class: _, ...otherProps } = props;
  return van.tags.input({ ...otherProps, class: finalClass });
};
const Select = (props = {}, ...children) => {
  const finalClass = `${FORM_CONTROL_CLASSES} ${props.class || ""}`.trim();
  const { class: _, ...otherProps } = props;
  return van.tags.select({ ...otherProps, class: finalClass }, ...children);
};
const Textarea = (props = {}) => {
  const finalClass = `${FORM_CONTROL_CLASSES} ${props.class || ""}`.trim();
  const { class: _, ...otherProps } = props;
  return van.tags.textarea({ ...otherProps, class: finalClass });
};

const LABEL_CLASSES = "pl-0 block mb-1 text-xl font-semibold text-gray-700";
const Label = (props = {}, ...children) => {
  const finalClass = `${LABEL_CLASSES} ${props.class || ""}`.trim();
  const { class: _, ...otherProps } = props;
  return van.tags.label({ ...otherProps, class: finalClass }, ...children);
};

const FORM_BASE_CLASSES = "space-y-3";
const Form = (props = {}, ...children) => {
  const finalClass = `${FORM_BASE_CLASSES} ${props.class || ""}`.trim();
  const { class: _, ...otherProps } = props;
  return van.tags.form({ ...otherProps, class: finalClass }, ...children);
};

const ModalBase = (initialContent = null, initialVisible = false) => {
  const header = van.state();
  const body = van.state();
  const footer = van.state();
  const isVisible = van.state(initialVisible);

  const open = () => (isVisible.val = true);
  const close = () => (isVisible.val = false);

  const setHeader = (newHeader = null) => (header.val = newHeader);
  const setBody = (newBody = null) => (body.val = newBody);
  const setFooter = (newFooter = null) => (footer.val = newFooter);

  const set = (input, show = false) => {
    if ("header" in input) setHeader(input.header);
    if ("body" in input) setBody(input.body);
    if ("footer" in input) setFooter(input.footer);
    if (show) open();
  };

  if (initialContent) set(initialContent);

  const div = van.tags.div;

  const render = () =>
    van.tags.div(
      {
        class: () =>
          isVisible.val
            ? "fixed inset-0 flex items-center justify-center bg-black/50 z-50"
            : "hidden",
        role: "dialog",
        "aria-modal": "true",
        onclick: (e) => e.target === e.currentTarget && close(),
      },
      div(
        {
          class: "bg-white rounded-lg shadow-xl p-12 min-w-xl",
          onclick: (e) => e.stopPropagation(),
        },
        () => (header.val ? header.val() : div()),
        () => (body.val ? body.val() : div()),
        () => (footer.val ? footer.val() : div()),
      ),
    );

  const mount = (container = document.body) => container.appendChild(render());

  return {
    open,
    close,
    setHeader,
    setBody,
    setFooter,
    set,
    mount,
    isVisible,
    render,
  };
};

const ModalTitle = (title) => {
  return van.tags.div({ class: "text-3xl font-bold text-blue-600" }, title);
};

const ModalClose = (onClose) => {
  return van.tags.button(
    {
      type: "button",
      class:
        "text-3xl text-gray-400 hover:text-gray-700 bg-transparent border-none cursor-pointer p-0",
      "aria-label": "Cerrar",
      onclick: onClose,
    },
    "×",
  );
};

const ModalHeaderWithTitleAndClose = (title, onClose) => {
  return van.tags.div(
    { class: "flex justify-between items-center pb-4" },
    ModalTitle(title),
    ModalClose(onClose),
  );
};

const ModalFooterWithCloseButton = (onClose, text = "Cerrar") => {
  return van.tags.div(
    { class: "pt-4 flex justify-end gap-2" },
    SecondaryButton({ onclick: onClose }, text),
  );
};

const Modal = (initialContent = null, initialVisible = false) => {
  const title = van.state();
  const header = () =>
    ModalHeaderWithTitleAndClose(title.val, () => modalBase.close());
  const footer = () => ModalFooterWithCloseButton(() => modalBase.close());

  const modalBase = ModalBase(
    {
      header,
      footer,
      ...initialContent,
    },
    initialVisible,
  );

  const setTitle = (newTitle) => (title.val = newTitle);
  const set = (input, show = false) => {
    if ("title" in input) setTitle(input.title);
    if (!("footer" in input)) input.footer = footer;
    modalBase.set(input, show);
  };

  return {
    ...modalBase,
    setTitle,
    set,
  };
};

const GatewayItem = (gateway) => {
  const { div, img, span } = van.tags;
  return div(
    { class: "flex flex-col items-center justify-center w-full h-full" },
    img({
      class: "max-h-12 w-full mb-1.5 filter brightness-105",
      src: `/img/payment/${gateway.img}`,
    }),
    span(
      { class: "text-xs font-bold text-gray-700 leading-none" },
      gateway.name,
    ),
  );
};

const GatewayButton = (gateway, onSelectGateway) => {
  const { div, button } = van.tags;

  return div(
    { class: "w-9/10 max-w-75 lg:w-1/5 lg:min-w-30 box-border text-center" },
    button(
      {
        class:
          "w-full h-25 p-2 bg-white border border-gray-300 rounded-xl" +
          " shadow-md transition-all duration-300 cursor-pointer" +
          " hover:shadow-lg hover:translate-y-0.5 hover:border-blue-500",
        type: "button",
        onclick: () => onSelectGateway(gateway),
      },
      GatewayItem(gateway),
    ),
  );
};

const GatewaysList = (gateways, onSelectGateway) => {
  const { div } = van.tags;

  return div(
    { class: "flex flex-wrap justify-center gap-4 p-2" },
    gateways.map((gateway) => GatewayButton(gateway, onSelectGateway)),
  );
};

const RechargeAmount = (info) => {
  const { div } = van.tags;

  const msg = van.state("");
  const error = van.state("");

  const params = info.params;
  const gateway = info.gateway;

  const validate = (data) => {
    const num = parseFloat(data.amount);
    if (num < params.monto_min_recarga) {
      error.val =
        "El monto debe ser superior a " +
        params.monto_min_recarga +
        " " +
        params.tipo;
    } else if (num > params.monto_max_recarga) {
      error.val =
        "El monto debe ser inferior a " +
        params.monto_max_recarga +
        " " +
        params.tipo;
    } else {
      error.val = "";
    }
    return error.val == "";
  };

  const onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    if (validate(data)) {
      msg.val = Spin("Generando recarga...");

      data.gateway = gateway;
      const result = await info.handleRechargeAmount(data);
      if ("error" in result) {
        error.val = result.error;
        msg.val = null;
      }
    }
  };

  return Form(
    { onsubmit },
    div(
      {},
      GatewayItem(gateway),
      div(
        { class: "mt-8" },
        Label(
          {},
          "Monto a recargar (" + params.tipo + ")",
          Input({ name: "amount", type: "number", required: true }),
        ),
        div(
          { class: "text-gray-900" },
          "Mínimo: " +
            params.monto_min_recarga +
            " " +
            params.tipo +
            ", Máximo: " +
            params.monto_max_recarga +
            " " +
            params.tipo,
        ),
        () =>
          error.val && div({ class: "text-red-600 text-sm mt-2" }, error.val),
      ),
    ),
    div(
      { class: "pt-4" },
      () => (msg.val && msg.val) || PrimaryButton({}, "Recargar"),
    ),
  );
};

const RechargeAmountModal = (info) => ({
  title: "Recargar con " + info.gateway.id,
  body: () => RechargeAmount(info),
});

const RechargeQr = (qr, url) => {
  const { div, button, img, span } = van.tags;

  return div(
    {},
    button(
      {
        class:
          "block border-4 border-blue-500 rounded-2xl p-6 my-5 w-full bg-white shadow-xl cursor-pointer " +
          "transition-all duration-200 ease-in-out " +
          "hover:border-blue-700 hover:shadow-2xl hover:-translate-y-0.5 hover:scale-105",
        onclick: () => window.open(url, "_blank"),
      },
      span(
        {
          class: "text-2xl font-extrabold text-blue-700 flex items-center",
        },
        "Haz clic aquí para abrir la plataforma",
      ),
      div(
        { class: "text-xl text-gray-600 italic" },
        "o escanea el código QR con tu app móvil",
      ),
      img({
        class: "mx-auto",
        src: qr,
        alt: "Código QR para recargar",
      }),
      div(
        { class: "text-xl text-gray-600 italic" },
        "Tu saldo se actualizará automáticamente.",
      ),
    ),
  );
};

const RechargeQrModal = (qr, url) => ({
  body: () => RechargeQr(qr, url),
});

const Spin = (msg) => {
  const { div } = van.tags;

  return div(
    {
      class: "flex flex-col items-center justify-center py-12",
    },
    div({
      class:
        "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4",
    }),
    div(
      {
        class: "text-lg text-gray-700",
      },
      msg,
    ),
  );
};

const SpinModal = (msg) => ({
  body: () => Spin(msg),
  footer: null,
});

class QRGenerator {
  static qrCode = null;

  static config = {
    width: 150,
    height: 150,
    type: "svg",
    imageOptions: {
      imageSize: 0.8,
      margin: 5,
    },
    dotsOptions: {
      color: "#000",
      type: "rounded",
    },
    backgroundOptions: {
      color: "#fff",
    },
  };

  static async generate(text, image) {
    if (!this.qrCode) {
      this.config.data = text;
      this.config.image = image;
      this.qrCode = new QRCodeStyling(this.config);
    } else {
      this.qrCode.update({ data: text, image: image });
    }

    try {
      const blob = await this.qrCode.getRawData("svg");
      const svgText = await blob.text();
      return {
        qr: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgText),
      };
    } catch (err) {
      console.error("Error al generar QR:", err);
      return { error: err };
    }
  }
}

class RechargeModule {
  constructor(gateways, params, element = null) {
    this.gateways = gateways;
    this.params = params;
    this.gateway = null;
    this.modal = Modal();

    this.modal.mount();
    if (element) this.mount(element);
  }

  handleGatewaySelect = (gateway) => {
    if ("url" in gateway) {
      window.location.href = gateway.url;
      return;
    }
    this.gateway = gateway;
    this.modal.set(RechargeAmountModal(this), true);
  };

  handleRechargeAmount = async (data) => {
    const fetchOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };

    const res = await fetch("/payment/zpay_recargar", fetchOptions);
    if (!res.ok)
      return {
        error: "No se pudo generar la recarga",
      };

    const result = await res.json();
    console.log("result:", result);
    if (!result.success)
      return {
        error: result.msg,
      };

    const qr = await QRGenerator.generate(
      result.url,
      "/img/payment/" + data.gateway.img,
    );
    this.modal.set(RechargeQrModal(qr.qr, result.url));
  };

  mount = (element) => {
    if (element) {
      this.element = element;
      van.add(
        document.getElementById(element),
        GatewaysList(this.gateways, this.handleGatewaySelect),
      );
    }
  };
}

const gateways = JSON.parse(
  '[{"img":"binance.svg","name":"Binance","id":"BINANCE","currency":"USD"},{"img":"bancos.svg","name":"Bancos","url":"\/pay_clients\/pay\/0","id":"BANCOS","currency":"USD"}]',
);
const params = JSON.parse(
  '{"id":1,"tipo":"USD","monto_min_recarga":"10","monto_max_recarga":"10000","monto_min_apuesta":"1","monto_max_apuesta_directa":"100","monto_min_retiro":"20","monto_max_retiro":"1000","bonif_max":"100","monto_max_retiro_pagomovil":"0","limite_pago":"0","limite_apuesta":"0","status":true,"deleted":false,"clacificacion":null,"created_at":null,"updated_at":"2026-02-27T20:44:57.000000Z","center_id":6,"tasa":"0","limite_diurno":null,"limite_nocturno":null,"limite_diurno_vip":null,"limite_nocturno_vip":null}',
);
const module = new RechargeModule(gateways, params, "gateways_list");
