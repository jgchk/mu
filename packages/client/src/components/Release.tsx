import * as React from 'react'
import { FC } from 'react'
import { useSelector } from 'react-redux'
import useRelease from '../hooks/useRelease'
import { RootState } from '../modules'
import ArtistList from './ArtistList'
import { SwitchCard } from './Cards'

const Release: FC<{ id: string }> = ({ id }) => {
  const { title, cover, artists } = useRelease(id)

  const viewType = useSelector(
    (state: RootState) => state.library.viewTypes.releases
  )

  return (
    <SwitchCard
      viewType={viewType}
      href={`/release/${id}`}
      width={200}
      imgSrc={cover}
      title={title}
      subtitle={<ArtistList ids={artists} />}
    />
  )
}

export default Release
