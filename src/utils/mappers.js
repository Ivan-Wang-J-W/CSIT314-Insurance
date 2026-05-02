export function campaignToFSA(c) {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    goalAmount: c.goal_amount,
    raisedAmount: c.raised_amount || 0,
    startDate: c.start_date,
    endDate: c.end_date,
    status: c.status,
    categoryId: c.category,
    location: c.location,
    imageUrl: c.image_url,
    fundraiserId: c.fundraiser_id,
    views: c.views || 0,
    shortlisted: c.shortlisted || 0,
    createdAt: c.created_at,
  };
}

export function fsaToPayload(data) {
  const out = {};
  if (data.title !== undefined) out.title = data.title;
  if (data.description !== undefined) out.description = data.description;
  if (data.goalAmount !== undefined) out.goal_amount = data.goalAmount;
  if (data.startDate !== undefined) out.start_date = data.startDate;
  if (data.endDate !== undefined) out.end_date = data.endDate;
  if (data.status !== undefined) out.status = data.status;
  if (data.categoryId !== undefined) out.category = data.categoryId;
  if (data.location !== undefined) out.location = data.location;
  if (data.imageUrl !== undefined) out.image_url = data.imageUrl;
  if (data.fundraiserId !== undefined) out.fundraiser_id = data.fundraiserId;
  return out;
}

export function backendToUser(u) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    fullName: u.full_name,
    role: u.role,
    status: u.status,
    createdAt: u.created_at,
  };
}

export function userToPayload(data) {
  const out = {};
  if (data.fullName !== undefined) out.full_name = data.fullName;
  if (data.email !== undefined) out.email = data.email;
  if (data.username !== undefined) out.username = data.username;
  return out;
}

export function backendToDonation(d) {
  return {
    id: d.id,
    fsaId: d.campaign_id,
    doneeId: d.donee_id,
    amount: d.amount,
    message: d.message,
    anonymous: d.anonymous,
    createdAt: d.created_at,
  };
}

export function backendToNotification(n) {
  return {
    id: n.id,
    userId: n.user_id,
    title: n.title,
    message: n.message,
    read: n.read,
    link: n.link,
    createdAt: n.created_at,
  };
}
