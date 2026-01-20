import { ResourceDetail, ResourceListItem } from './types/index.js';

const API_BASE_URL = 'https://api.xona-agent.com';

/**
 * Fetch the list of available resources
 */
export async function discoverResources(): Promise<ResourceListItem[]> {
  const response = await fetch(`${API_BASE_URL}/resource-list`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch resources: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Handle both array and object with data property
  const resources = Array.isArray(data) ? data : (data.data || data.resources || []);
  
  return resources;
}

/**
 * Fetch detailed information about a specific resource
 */
export async function getResourceDetail(slug: string): Promise<ResourceDetail> {
  const response = await fetch(`${API_BASE_URL}/resource-detail/${slug}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Resource "${slug}" not found`);
    }
    throw new Error(`Failed to fetch resource detail: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Normalize version field
  const resource = {
    ...data,
    version: data.version || data.x402_version || 'v1',
    x402_version: data.x402_version || data.version || 'v1',
  };
  
  return resource;
}

