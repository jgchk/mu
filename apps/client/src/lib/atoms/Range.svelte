<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import { cn } from '$lib/utils/classes'

  // Props
  export let min = 0
  export let max = 100
  export let increment = (max - min) / 20
  export let id: string | null = null
  export let value = 0

  // Node Bindings
  let container: HTMLDivElement | undefined
  let thumb: HTMLDivElement | undefined
  let progressBar: HTMLDivElement | undefined
  let element: HTMLDivElement | undefined

  // Internal State
  let elementX: number | undefined
  let currentThumb: HTMLDivElement | undefined
  let holding = false

  // Dispatch 'change' events
  const dispatch = createEventDispatcher<{ change: number }>()

  // Mouse shield used onMouseDown to prevent any mouse events penetrating other elements,
  // ie. hover events on other elements while dragging. Especially for Safari
  const mouseEventShield = document.createElement('div')
  mouseEventShield.setAttribute('class', 'mouse-over-shield')
  mouseEventShield.addEventListener('mouseover', (e) => {
    e.preventDefault()
    e.stopPropagation()
  })

  function resizeWindow() {
    elementX = element?.getBoundingClientRect().left
  }

  // Allows both bind:value and on:change for parent value retrieval
  function setValue(val: number) {
    value = val
    dispatch('change', value)
  }

  function onTrackEvent(e: TouchEvent | MouseEvent) {
    // Update value immediately before beginning drag
    updateValueOnEvent(e)
    onDragStart(e)
  }

  function onDragStart(e: TouchEvent | MouseEvent) {
    // If mouse event add a pointer events shield
    if (e.type === 'mousedown') document.body.append(mouseEventShield)
    currentThumb = thumb
  }

  function onDragEnd(e: TouchEvent | MouseEvent) {
    // If using mouse - remove pointer event shield
    if (isMouseEvent(e) && e.type === 'mouseup') {
      if (document.body.contains(mouseEventShield)) document.body.removeChild(mouseEventShield)
    }
    currentThumb = undefined
  }

  // Accessible keypress handling
  function onKeyPress(e: KeyboardEvent) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      if (value + increment > max || value >= max) {
        setValue(max)
      } else {
        setValue(value + increment)
      }
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      if (value - increment < min || value <= min) {
        setValue(min)
      } else {
        setValue(value - increment)
      }
    }
  }

  function calculateNewValue(clientX: number) {
    // Find distance between cursor and element's left cord (20px / 2 = 10px) - Center of thumb
    let delta = clientX - (elementX ?? 0)

    // Use width of the container minus (5px * 2 sides) offset for percent calc
    let percent = (delta * 100) / (container?.clientWidth ?? 0)

    // Limit percent 0 -> 100
    percent = percent < 0 ? 0 : percent > 100 ? 100 : percent

    // Limit value min -> max
    setValue((percent * (max - min)) / 100 + min)
  }

  // Handles both dragging of touch/mouse as well as simple one-off click/touches
  function updateValueOnEvent(e: TouchEvent | MouseEvent) {
    // touchstart && mousedown are one-off updates, otherwise expect a currentPointer node
    if (!currentThumb && e.type !== 'touchstart' && e.type !== 'mousedown') {
      return false
    }

    if (e.stopPropagation) e.stopPropagation()
    if (e.preventDefault) e.preventDefault()

    // Get client's x cord either touch or mouse
    const clientX = isTouchEvent(e) ? e.touches[0].clientX : e.clientX

    calculateNewValue(clientX)
  }

  // React to left position of element relative to window
  $: if (element) elementX = element.getBoundingClientRect().left

  // Set a class based on if dragging
  $: holding = Boolean(currentThumb)

  // Update progressbar and thumb styles to represent value
  $: if (progressBar && thumb) {
    // Limit value min -> max
    value = value > min ? value : min
    value = value < max ? value : max

    let percent = ((value - min) * 100) / (max - min)

    // Update thumb position + active range track width
    thumb.style.left = `calc(${percent}% - 7px)`
    progressBar.style.width = `${percent}%`
  }

  function isTouchEvent(event: TouchEvent | MouseEvent): event is TouchEvent {
    return 'touches' in event
  }
  function isMouseEvent(event: TouchEvent | MouseEvent): event is MouseEvent {
    return 'button' in event
  }
</script>

<svelte:window
  on:touchmove|nonpassive={updateValueOnEvent}
  on:touchcancel={onDragEnd}
  on:touchend={onDragEnd}
  on:mousemove={updateValueOnEvent}
  on:mouseup={onDragEnd}
  on:resize={resizeWindow}
/>
<div class="relative w-full">
  <div
    class="range__wrapper group relative box-border min-w-full py-2 outline-none"
    tabindex="0"
    on:keydown={onKeyPress}
    bind:this={element}
    role="slider"
    aria-valuemin={min}
    aria-valuemax={max}
    aria-valuenow={value}
    {id}
    on:mousedown={onTrackEvent}
    on:touchstart={onTrackEvent}
  >
    <div class="range__track h-1 rounded-full bg-gray-700" bind:this={container}>
      <div class="bg-primary-500 absolute h-1 w-0 rounded-full" bind:this={progressBar} />
      <div
        class={cn(
          'range__thumb absolute -mt-[5px] h-[14px] w-[14px] cursor-pointer select-none rounded-full bg-white',
          holding
            ? 'range__thumb--holding'
            : 'scale-90 transform opacity-0 group-hover:scale-100 group-hover:opacity-100'
        )}
        bind:this={thumb}
        on:touchstart={onDragStart}
        on:mousedown={onDragStart}
      />
    </div>
  </div>
</div>

<svelte:head>
  <style>
    .mouse-over-shield {
      position: fixed;
      top: 0px;
      left: 0px;
      height: 100%;
      width: 100%;
      background-color: transparent;
      z-index: 10000;
      cursor: grabbing;
    }
  </style>
</svelte:head>

<style lang="postcss">
  .range__wrapper:focus-visible > .range__track {
    box-shadow: 0 0 0 2px white, 0 0 0 3px theme(colors.secondary.500);
  }

  .range__thumb {
    transition: box-shadow 125ms, opacity 125ms, transform 125ms;
    box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.14), 0 0px 2px 1px rgba(0, 0, 0, 0.2);
  }

  .range__thumb--holding {
    box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.14), 0 1px 2px 1px rgba(0, 0, 0, 0.2),
      0 0 0 6px color(theme(colors.primary.500) a(30%));
  }
</style>
