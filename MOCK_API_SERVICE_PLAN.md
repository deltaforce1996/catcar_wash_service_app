# Mock API Service Layer Implementation Plan

## **Current State Analysis**
- Nuxt 3 app with hardcoded composables (`useDashboardData`, `useEnhancedSalesData`) 
- Mock data embedded directly as static objects in composables
- Two JSON data directories: `api-response-data/` and `mockup-data/`
- No existing services layer architecture

## **Phase 1: Service Architecture Setup**
1. **Create services directory structure**:
   ```
   services/
   ├── api/
   │   ├── base/
   │   │   ├── baseApiService.ts     # Base API client
   │   │   └── mockApiService.ts     # Mock implementation
   │   ├── dashboard/
   │   │   ├── dashboardService.ts   # Dashboard API interface
   │   │   └── index.ts              # Service exports
   │   ├── devices/
   │   │   ├── deviceService.ts      # Device management API
   │   │   └── index.ts
   │   └── index.ts                  # Main service registry
   └── types/
       ├── api.ts                    # API response types
       ├── dashboard.ts              # Dashboard-specific types
       └── index.ts                  # Type exports
   ```

2. **Create TypeScript interfaces** from existing JSON responses
3. **Environment-based service factory** with development/production switching

## **Phase 2: Mock API Service Implementation**
1. **Base Mock Service**: Abstract class for common API response patterns
2. **Dashboard Service**: Replace `useDashboardData` logic with service calls
3. **Sales Data Service**: Replace `useEnhancedSalesData` with proper service layer
4. **Device Management Service**: For device-related API operations

## **Phase 3: Composable Refactoring**
1. **Transform existing composables** to use service layer instead of hardcoded data
2. **Add loading states** and error handling
3. **Implement reactive data fetching** with proper state management
4. **Maintain backward compatibility** during transition

## **Phase 4: Integration & Environment Setup**
1. **Add environment configuration** for switching between mock/real APIs
2. **Update existing pages** to use refactored composables
3. **Add development utilities** for easy mock data management
4. **Create JSON-to-service data loader** for easy mockup data updates

## **Benefits of This Approach**
- ✅ **Professional architecture** ready for real API integration
- ✅ **Environment switching** between mock and production
- ✅ **Type safety** with generated interfaces from JSON data
- ✅ **Maintainable** mock data through external JSON files
- ✅ **Backward compatible** with existing composable usage
- ✅ **Performance benefits** with proper caching and loading states

## **Expected File Changes**
- **New**: ~15 service/type files
- **Modified**: 3 existing composables, 1-2 pages
- **No breaking changes** to existing component interfaces

## **Detailed Implementation Steps**

### Step 1: Base Service Infrastructure
Create `services/api/base/baseApiService.ts`:
- Abstract base class with common API methods
- Response type definitions
- Error handling patterns

Create `services/api/base/mockApiService.ts`:
- Extends base service
- Loads JSON files dynamically
- Simulates network delays

### Step 2: Type System
Generate TypeScript interfaces from JSON responses:
- `services/types/api.ts` - Common API response structure
- `services/types/dashboard.ts` - Dashboard-specific types
- Auto-generate from existing JSON files

### Step 3: Service Implementations
Create specific services for each domain:
- Dashboard service using `dashboard-summary-response.json`
- Device service using `devices-response.json`
- Sales service using `log-sale-dashborad-data-table.json`

### Step 4: Composable Migration
Refactor existing composables:
- Replace hardcoded data with service calls
- Add reactive loading/error states
- Maintain same public interface

### Step 5: Environment Configuration
Add runtime configuration for API switching:
- Development: Use mock services
- Production: Use real API services
- Easy toggle for testing

## **Migration Path**
1. Create service layer alongside existing composables
2. Gradually migrate one composable at a time
3. Test each migration before proceeding
4. Remove hardcoded data once services are stable
5. Add real API integration when backend is ready