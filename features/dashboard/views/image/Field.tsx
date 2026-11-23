import {
  type PropsWithChildren,
  type SyntheticEvent,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { Button } from '@/components/ui/button'
import { FieldLabel } from '@/components/ui/field-label'
import { FieldDescription } from '@/components/ui/field-description'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ImageIcon, Undo2, Upload } from 'lucide-react'

import type { FieldProps } from '../../types'
import { formatBytes } from './utils'
import type { ImageValue } from './index'
import { type controller, validateImage } from '.'

export function Field(props: FieldProps<typeof controller>) {
  const { autoFocus, field, onChange, value } = props
  const inputRef = useRef<HTMLInputElement | null>(null)
  const errorMessage = validateImage(field.extensions, value)

  const onUploadChange = ({
    currentTarget: { validity, files },
  }: SyntheticEvent<HTMLInputElement>) => {
    const file = files?.[0]
    if (!file) return // bail if the user cancels from the file browser
    onChange?.({
      kind: 'upload',
      data: { file, validity },
      previous: value,
    })
  }
  const onFileTrigger = () => {
    inputRef.current?.click()
  }

  // Generate a random input key when the value changes, to ensure the file input is unmounted and
  // remounted (this is the only way to reset its value and ensure onChange will fire again if
  // the user selects the same file again)
  const inputKey = useMemo(() => Math.random(), [value])
  const accept = useMemo(
    () => field.extensions.map((ext: string) => [`.${ext}`, `image/${ext}`].join(', ')).join(', '),
    []
  )

  return (
    <div className="flex flex-col gap-1">
      <FieldLabel htmlFor={field.path}>{field.label}</FieldLabel>
      {field.description && <FieldDescription>{field.description}</FieldDescription>}
      {errorMessage && (
        <div className="text-[12px] text-[var(--ks-danger)]">{errorMessage}</div>
      )}
      <ImageView
        isInvalid={Boolean(errorMessage)}
        onFileTrigger={onFileTrigger}
        onChange={onChange}
        value={value}
      />
      <Input
        id={field.path}
        accept={accept}
        autoComplete="off"
        autoFocus={autoFocus}
        disabled={onChange === undefined}
        className="hidden"
        key={inputKey}
        name={field.path}
        onChange={onUploadChange}
        ref={inputRef}
        type="file"
      />
    </div>
  )
}

function ImageView(props: {
  onFileTrigger: () => void
  isInvalid?: boolean
  onChange?: (value: ImageValue) => void
  value: ImageValue
}) {
  const { isInvalid, onFileTrigger, onChange, value } = props
  const imageData = useImageData(value)

  return (
    <div className="flex flex-col gap-2">
      {isInvalid || !imageData ? null : (
        <ImageDetails {...imageData}>
          {onChange && (
            <div className="ks-track mt-auto self-start">
              <Button type="button" size="sm" variant="outline" onClick={onFileTrigger}>
                Change
              </Button>
              {value.kind === 'from-server' && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onChange({ kind: 'remove', previous: value })
                  }}
                >
                  Remove
                </Button>
              )}
              {value.kind === 'upload' && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onChange(value.previous)
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          )}
        </ImageDetails>
      )}

      {!imageData && onChange === undefined && (
        <div className="flex h-10 items-center gap-2 rounded-[8px] bg-[var(--ks-surface-2)] px-2.5 text-[12px] text-[var(--ks-label)] shadow-[inset_0_0_0_1px_var(--ks-line)]">
          <ImageIcon className="size-3.5" />
          No image
        </div>
      )}
      {!imageData && onChange !== undefined && (
        <>
        <button
          type="button"
          disabled={onChange === undefined}
          onClick={onFileTrigger}
          className="group flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-[10px] text-[12px] text-[var(--ks-dim)] shadow-[inset_0_0_0_1px_var(--ks-line-strong)] [background:repeating-linear-gradient(135deg,transparent_0_6px,var(--ks-surface-2)_6px_7px)] hover:text-[var(--ks-ink)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="ks-raised grid size-8 place-items-center rounded-[8px]">
            <Upload className="size-4" />
          </span>
          Upload image
        </button>
        <div className="flex gap-2 items-center empty:hidden">
          {value.kind === 'remove' && value.previous && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (value.previous !== undefined) {
                  onChange?.(value?.previous)
                }
              }}
            >
              <Undo2 />
              Undo remove
            </Button>
          )}
        </div>
        </>
      )}
    </div>
  )
}

function useObjectURL(fileData: File | undefined) {
  const [objectURL, setObjectURL] = useState<string | undefined>(undefined)
  useEffect(() => {
    if (!fileData) return
    const url = URL.createObjectURL(fileData)
    setObjectURL(url)
    return () => URL.revokeObjectURL(url)
  }, [fileData])
  return objectURL
}

function ImageDetails(props: PropsWithChildren<ImageData>) {
  // hide content until the uploaded image until it's available; use dimensions
  // as an indicator since they're set on load.
  const isLoaded = props.height && props.width

  return (
    <div
      className={cn(
        "flex overflow-hidden rounded-[10px] bg-[var(--ks-surface-2)] shadow-[inset_0_0_0_1px_var(--ks-line)] transition-opacity",
        "max-sm:flex-col",
        isLoaded ? "opacity-100" : "opacity-0"
      )}
    >
      {props.url ? (
        <img
          onLoad={props.onLoad}
          className={cn(
            "max-h-40 max-w-full min-w-0 object-contain bg-[var(--ks-track)]",
            "sm:h-32 sm:w-40 sm:flex-shrink-0"
          )}
          alt="preview of the upload"
          src={props.url}
        />
      ) : (
        <div className={cn(
          "h-32 max-w-full min-w-0 flex items-center justify-center bg-[var(--ks-track)]",
          "sm:w-40 sm:flex-shrink-0"
        )}>
          <ImageIcon className="size-6 text-[var(--ks-label)]" />
        </div>
      )}
      <div className="p-3 flex flex-col gap-1 flex-1 min-w-0">
        {props.name ? (
          <div className="truncate font-mono text-[12px] font-medium text-[var(--ks-ink)]" title={props.name}>
            {props.name}
          </div>
        ) : null}
        {props.filesize ? (
          <div className="font-mono text-[12px] text-[var(--ks-dim)]">
            {formatBytes(props.filesize)} · {props.width}×{props.height}
          </div>
        ) : null}

        {/* field controls dependant on value type */}
        {props.children}
      </div>
    </div>
  )
}

type ImageData = {
  name?: string
  url: string
  filesize?: number
  width?: number
  height?: number
  onLoad: (event: SyntheticEvent<HTMLImageElement>) => void
}

function useImageData(value: ImageValue): ImageData | null {
  // only relevant for uploaded images, but we must observe the rules of hooks
  // so these can't be called conditionally.
  const imagePathFromUpload = useObjectURL(value.kind === 'upload' ? value.data.file : undefined)
  const [dimensions, setDimensions] = useState({ height: 0, width: 0 })
  const onLoad = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      if (value.kind === 'upload') {
        setDimensions({
          height: event.currentTarget.naturalHeight,
          width: event.currentTarget.naturalWidth,
        })
      }
    },
    [value.kind]
  )

  // reset dimensions when the user cancels the upload. we use the dimensions as
  // a signal that the image has loaded.
  useEffect(() => {
    if (value.kind !== 'upload') {
      setDimensions({ height: 0, width: 0 })
    }
  }, [value.kind])

  switch (value.kind) {
    case 'from-server':
      return {
        url: value.data.url,
        name: `${value.data.id}.${value.data.extension}`,
        filesize: value.data.filesize,
        width: value.data.width,
        height: value.data.height,
        onLoad,
      } as const

    case 'upload':
      return {
        // always string for simpler types, should be unreachable if the file selection fails validation.
        url: imagePathFromUpload || '',
        name: value.data.file.name,
        filesize: value.data.file.size,
        width: dimensions.width,
        height: dimensions.height,
        onLoad,
      } as const
  }

  return null
}