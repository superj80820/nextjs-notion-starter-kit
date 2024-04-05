
import React from 'react'
import Giscus from '@giscus/react'
import { Repo } from '@giscus/react'
import styles from './styles.module.css'

export const GiscusComments: React.FC<{
  darkMode: boolean
  repo: Repo
  repoId: string
  category: string
  categoryId: string
}> = (props: {
  darkMode: boolean
  repo: Repo
  repoId: string
  category: string
  categoryId: string
}) => {
    return (
      <div className={styles.giscusComments}>
        <Giscus
          id="comments"
          repo={props.repo}
          repoId={props.repoId}
          category={props.category}
          categoryId={props.categoryId}
          mapping="pathname"
          strict="0"
          reactionsEnabled="1"
          emitMetadata="0"
          inputPosition="top"
          theme={props.darkMode ? "dark" : "light"}
          lang="zh-TW"
          loading="lazy"
        />
      </div>
    )
  }

