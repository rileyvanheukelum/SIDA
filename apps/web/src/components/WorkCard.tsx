import { Link } from 'react-router-dom'
import type { Work } from '../data/mock'

import './WorkCard.css'

export function WorkCard({ work }: { work: Work }) {
  return (
    <article className="work-card">
      <div className="work-card-image">
        <img src={work.image} alt="" />
      </div>

      <div className="work-card-content">
        <p className="work-card-category type-body-2">
          {work.category}
        </p>

        <h3 className="work-card-title type-subheading-4">
          {work.title}
        </h3>

        <p className="work-card-description type-body-2">
          {work.description}
        </p>

        <Link
          className="work-card-author type-italic-label"
          to={`/members/${work.memberId}`}
        >
          {work.memberName}
        </Link>
      </div>
    </article>
  )
}