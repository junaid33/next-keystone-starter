import { type RenderElementProps, useSelected } from 'slate-react'

import { LayoutArea, LayoutContainer } from './layouts'
import { ComponentBlocksElement, ComponentInlineProp } from './component-blocks'
import { LinkElement } from './link'
import { HeadingElement } from './heading'
import { BlockquoteElement } from './blockquote'
import { RelationshipElement } from './relationship'

const alignmentClassMap = {
  start: 'text-left',
  center: 'text-center',
  end: 'text-right'
}

// some of the renderers read properties of the element
// and TS doesn't understand the type narrowing when doing a spread for some reason
// so that's why things aren't being spread in some cases
export const renderElement = (props: RenderElementProps) => {
  switch (props.element.type) {
    case 'layout':
      return (
        <LayoutContainer
          attributes={props.attributes}
          children={props.children}
          element={props.element} />
      )
    case 'layout-area':
      return <LayoutArea {...props} />
    case 'code':
      return <CodeElement {...props} />
    case 'component-block': {
      return (
        <ComponentBlocksElement
          attributes={props.attributes}
          children={props.children}
          element={props.element} />
      )
    }
    case 'component-inline-prop':
    case 'component-block-prop':
      return <ComponentInlineProp {...props} />
    case 'heading':
      return (
        <HeadingElement
          attributes={props.attributes}
          children={props.children}
          element={props.element} />
      )
    case 'link':
      return (
        <LinkElement
          attributes={props.attributes}
          children={props.children}
          element={props.element} />
      )
    case 'ordered-list':
      return <ol {...props.attributes} className="list-decimal pl-4">{props.children}</ol>
    case 'unordered-list':
      return <ul {...props.attributes} className="list-disc pl-4">{props.children}</ul>
    case 'list-item':
      return <li {...props.attributes}>{props.children}</li>
    case 'list-item-content':
      return <span {...props.attributes}>{props.children}</span>
    case 'blockquote':
      return <BlockquoteElement {...props} />
    case 'relationship':
      return (
        <RelationshipElement
          attributes={props.attributes}
          children={props.children}
          element={props.element} />
      )
    case 'divider':
      return <DividerElement {...props} />
    default:
      return (
        <p 
          className={(props.element as any).textAlign ? alignmentClassMap[(props.element as any).textAlign as keyof typeof alignmentClassMap] || '' : ''}
          {...props.attributes}
        >
          {props.children}
        </p>
      )
  }
}

/* Block Elements */

const CodeElement = ({
  attributes,
  children
}: RenderElementProps) => {
  return (
    <pre
      spellCheck="false"
      className="bg-muted border border-border rounded-sm font-mono text-sm p-4 overflow-x-auto"
      {...attributes}
    >
      <code className="font-inherit">{children}</code>
    </pre>
  )
}

const DividerElement = ({
  attributes,
  children
}: RenderElementProps) => {
  const selected = useSelected()
  return (
    <div
      {...attributes}
      className="py-4 my-4 caret-transparent"
    >
      <hr
        className={`border-0 h-0.5 ${selected ? 'bg-primary' : 'bg-border'}`}
      />
      {children}
    </div>
  )
}