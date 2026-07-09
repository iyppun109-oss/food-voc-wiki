export type ForbiddenSeverity = '주의' | '위험' | '중대'

export interface ForbiddenExpression {
  keyword: string
  reason: string
  replacement: string
  severity: ForbiddenSeverity
}

export const forbiddenExpressions: ForbiddenExpression[] = [
  {
    keyword: '저희 잘못입니다',
    reason: '책임을 단정하는 표현입니다.',
    replacement: '정확한 원인 확인을 위해 관련 내용을 점검하겠습니다.',
    severity: '위험',
  },
  {
    keyword: '저희 책임입니다',
    reason: '책임을 단정하는 표현입니다.',
    replacement: '관련 공정을 확인하고 필요한 조치를 진행하겠습니다.',
    severity: '위험',
  },
  {
    keyword: '담당자가 실수했습니다',
    reason: '개인을 지목해 책임을 단정하는 표현입니다.',
    replacement: '현장 확인 후 개선이 필요한 부분을 보완하겠습니다.',
    severity: '위험',
  },
  {
    keyword: '조리자가 잘못했습니다',
    reason: '개인을 지목해 책임을 단정하는 표현입니다.',
    replacement: '현장 확인 후 개선이 필요한 부분을 보완하겠습니다.',
    severity: '위험',
  },
  {
    keyword: '음식 때문에 발생했습니다',
    reason: '원인을 단정하는 표현입니다.',
    replacement: '말씀 주신 내용은 현장에서 확인하겠습니다.',
    severity: '위험',
  },
  {
    keyword: '확실히 저희 음식 때문입니다',
    reason: '원인을 단정하는 표현입니다.',
    replacement: '정확한 원인 확인을 위해 관련 메뉴와 조리·배식 과정을 점검하겠습니다.',
    severity: '위험',
  },
  {
    keyword: '이물 혼입이 확실합니다',
    reason: '원인을 단정하는 표현입니다.',
    replacement: '말씀 주신 내용은 현장에서 추가로 확인하겠습니다.',
    severity: '위험',
  },
  {
    keyword: '벌레가 들어갔습니다',
    reason: '원인을 단정하는 표현입니다.',
    replacement: '지금 말씀해주신 사항은 정확한 확인을 위해 점검하겠습니다.',
    severity: '위험',
  },
  {
    keyword: '보상해드리겠습니다',
    reason: '보상 내용을 임의로 확정하는 표현입니다.',
    replacement: '필요한 사항은 관련 기준에 따라 검토 후 안내드리겠습니다.',
    severity: '주의',
  },
  {
    keyword: '치료비를 드리겠습니다',
    reason: '보상 내용을 임의로 확정하는 표현입니다.',
    replacement: '확인 결과와 기준에 따라 필요한 절차를 안내드리겠습니다.',
    severity: '주의',
  },
  {
    keyword: '환불해드리겠습니다',
    reason: '보상 내용을 임의로 확정하는 표현입니다.',
    replacement: '확인 결과와 기준에 따라 필요한 절차를 안내드리겠습니다.',
    severity: '주의',
  },
  {
    keyword: '전액 보상하겠습니다',
    reason: '보상 내용을 임의로 확정하는 표현입니다.',
    replacement: '확인 결과와 기준에 따라 필요한 절차를 안내드리겠습니다.',
    severity: '주의',
  },
  {
    keyword: '고객님 착각입니다',
    reason: '고객 쪽으로 책임을 돌리는 표현입니다.',
    replacement: '고객님께서 불편을 느끼신 부분을 확인하고 관련 사항을 점검하겠습니다.',
    severity: '위험',
  },
  {
    keyword: '잘못 보신 것 같습니다',
    reason: '고객 체험을 부정하는 표현입니다.',
    replacement: '고객님께서 불편을 느끼신 부분을 다시 확인하겠습니다.',
    severity: '위험',
  },
  {
    keyword: '그럴 리 없습니다',
    reason: '고객 불편을 부정하는 표현입니다.',
    replacement: '확인이 필요한 내용인지 재점검 후 추가 안내드리겠습니다.',
    severity: '위험',
  },
  {
    keyword: '문제 없습니다',
    reason: '문제를 단정적으로 부정하는 표현입니다.',
    replacement: '말씀 주신 사항은 추가로 확인하고 공유드리겠습니다.',
    severity: '주의',
  },
  {
    keyword: '확인이 어렵습니다',
    reason: '회피성 표현입니다.',
    replacement: '확인 가능한 범위 내에서 관련 내용을 점검하겠습니다.',
    severity: '주의',
  },
  {
    keyword: '어쩔 수 없습니다',
    reason: '책임소재를 회피해 보이는 표현입니다.',
    replacement: '관련 기준과 현장 상황을 확인한 뒤 안내드리겠습니다.',
    severity: '주의',
  },
  {
    keyword: '규정상 안 됩니다',
    reason: '회피성 표현입니다.',
    replacement: '관련 기준을 기준으로 가능한 범위에서 대응 방안을 검토하겠습니다.',
    severity: '주의',
  },
  {
    keyword: '저희도 모릅니다',
    reason: '확인 책임을 회피하는 표현입니다.',
    replacement: '확인 가능한 범위 내에서 관련 내용을 점검하고 공유드리겠습니다.',
    severity: '주의',
  },
  {
    keyword: '식중독입니다',
    reason: '건강상 위험을 단정하는 표현입니다.',
    replacement: '고객님께서 불편 증상을 호소하신 건으로 빠르게 확인하겠습니다.',
    severity: '중대',
  },
  {
    keyword: '치아가 파절되었습니다',
    reason: '안전사고를 단정하는 표현입니다.',
    replacement: '고객님께서 불편 증상을 호소하신 건으로 확인하겠습니다.',
    severity: '중대',
  },
  {
    keyword: '다쳤습니다',
    reason: '신체 손상에 대해 단정하는 표현입니다.',
    replacement: '고객님께서 느끼신 증상을 다시 확인하고 필요한 조치를 진행하겠습니다.',
    severity: '중대',
  },
  {
    keyword: '음식 때문에 아픈 겁니다',
    reason: '원인을 단정하는 표현입니다.',
    replacement: '고객님께서 호소하신 증상은 상태 확인 후 원인을 점검하겠습니다.',
    severity: '중대',
  },
]
