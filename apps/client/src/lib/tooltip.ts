import type { Props as TippyProps } from 'tippy.js';
import tippy from 'tippy.js';

interface ActionReturn<Parameter> {
  update?: (parameter: Parameter) => void;
  destroy?: () => void;
}

interface Action<Parameter = void, Return = ActionReturn<Parameter>> {
  <Node extends HTMLElement>(node: Node, parameter: Parameter): Return | void;
}

export const TooltipDefaults = {
  arrow: true,
  duration: 100,
  delay: 300
} as const;
const injectDefaultParams = (params: Partial<TippyProps>): Partial<TippyProps> => ({
  ...params,
  arrow: params.arrow ?? TooltipDefaults.arrow,
  duration: params.duration ?? TooltipDefaults.duration,
  delay: params.delay ?? TooltipDefaults.delay
});

export const tooltipAction: Action<Partial<TippyProps>> = (node, params) => {
  const tip = tippy(node, injectDefaultParams(params));
  return {
    update: (newParams) => {
      tip.setProps(injectDefaultParams(newParams));
    },
    destroy: () => {
      tip.destroy();
    }
  };
};
