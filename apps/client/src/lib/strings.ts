import { toErrorString } from 'utils'

export const addedToDownloads = (title: string | undefined) =>
  title ? `Added "${title}" to download queue!` : 'Added to download queue!'

export const importReleaseSuccess = (title: string | undefined) =>
  `Imported "${title || 'release'}"!`
export const importReleaseFail = (reason: unknown) =>
  `Failed to import release: ${toErrorString(reason)}`
export const importReleaseError = (error: unknown) =>
  `Error while importing release: ${toErrorString(error)}`

export const importTrackSuccess = (title: string | undefined) => `Imported "${title || 'track'}"!`
export const importTrackFail = (reason: unknown) =>
  `Failed to import track: ${toErrorString(reason)}`
export const importTrackError = (error: unknown) =>
  `Error while importing track: ${toErrorString(error)}`

export const updateReleaseSuccess = (title: string | undefined) =>
  `Updated "${title || 'release'}"!`
export const updateReleaseFail = (reason: unknown) =>
  `Failed to update release: ${toErrorString(reason)}`
export const updateReleaseError = (error: unknown) =>
  `Error while updating release: ${toErrorString(error)}`

export const formErrors = () => 'Check the form for errors'
