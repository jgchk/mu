<div class="popover-arrow" data-popper-arrow />

<style lang="postcss">
  .popover-arrow,
  .popover-arrow::before {
    position: absolute;
    width: 8px;
    height: 8px;
    background: inherit;
    border-color: theme(colors.gray.600);
    border-style: solid;
  }

  .popover-arrow {
    visibility: hidden;
  }

  .popover-arrow::before {
    visibility: visible;
    content: '';
    transform: rotate(45deg);
  }

  :global([data-popper-placement^='top'] > .popover-arrow) {
    bottom: -4px;
  }
  :global([data-popper-placement^='top'] > .popover-arrow::before) {
    border-bottom-width: 1px;
    border-right-width: 1px;
  }

  :global([data-popper-placement^='bottom'] > .popover-arrow) {
    top: -4px;
  }
  :global([data-popper-placement^='bottom'] > .popover-arrow::before) {
    border-top-width: 1px;
    border-left-width: 1px;
  }

  :global([data-popper-placement^='left'] > .popover-arrow) {
    right: -4px;
  }
  :global([data-popper-placement^='left'] > .popover-arrow::before) {
    border-top-width: 1px;
    border-right-width: 1px;
  }

  :global([data-popper-placement^='right'] > .popover-arrow) {
    left: -4px;
  }
  :global([data-popper-placement^='right'] > .popover-arrow::before) {
    border-bottom-width: 1px;
    border-left-width: 1px;
  }
</style>
