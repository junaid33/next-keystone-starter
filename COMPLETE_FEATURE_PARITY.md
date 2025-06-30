# Complete Feature Parity: SSR Dashboard vs Keystone Dashboard

This document outlines all identified discrepancies between our SSR dashboard implementation and Keystone's original client-side dashboard that need to be addressed for complete feature parity.

## 🔴 **CRITICAL ISSUES** (Immediate Fixes Required)

### 1. **Missing Field Type Support in Filtering**
**Status**: 🚫 **Broken**  
**Files**: `features/dashboard/lib/buildWhereClause.ts`

**Missing field types from `FIELD_FILTER_MAPPINGS`:**
- ❌ Document fields - No filtering support at all
- ❌ JSON fields - No filtering support at all  
- ❌ Image fields - No filtering support at all
- ❌ Virtual fields - No filtering support at all

**Impact**: Users cannot filter by these field types, causing filtering to silently fail.

**Fix Required**: Add filter mappings for all missing field types.

### 2. **GraphQL Selection Mismatches**
**Status**: 🚫 **Broken**  
**Files**: `features/dashboard/actions/getListItemsAction.ts`, `FIELD_GRAPHQL_SELECTIONS`

#### Document Field Selection Mismatch
```typescript
// Field controller (correct):
graphqlSelection: `${config.path} {document(hydrateRelationships: true)}`

// Our server mapping (broken):  
document: (fieldPath) => `${fieldPath} { document }`
```
**Impact**: Relationship data within documents won't load properly.

#### Relationship Count Display Mode
```typescript
// Field controller (correct):
graphqlSelection: config.fieldMeta.displayMode === "count" 
  ? `${config.path}Count`
  : `${config.path} { id label: ${refLabelField} }`

// Our server mapping (broken):
relationship: (fieldPath, fieldMeta) => `${fieldPath} { id label: ${fieldMeta?.refLabelField || 'name'} }`
```
**Impact**: Count display mode completely broken - wrong GraphQL query structure.

### 3. **Authentication Headers Issue** 
**Status**: ✅ **FIXED**  
**Files**: `features/dashboard/lib/cookies.ts`

~~**Issue**: Inconsistent auth headers - `cookies.ts` used Bearer tokens while `auth.ts` used Cookie headers.~~  
**Fixed**: Updated `cookies.ts` to use `Cookie: keystonejs-session=${token}` pattern consistently.

## 🟡 **HIGH PRIORITY ISSUES**

### 4. **Select Field Value Transformation**
**Status**: 🚫 **Broken**  
**Files**: `features/dashboard/lib/buildWhereClause.ts`

**Issue**: Field controller transforms select values but server mapping doesn't:
```typescript
// Field controller (correct):
graphql: ({ type, value }) => ({
  [config.path]: {
    [type === 'not_matches' ? 'notIn' : 'in']: options.map(x => t(x)),
  },
})

// Our server mapping (broken):
graphql: (fieldPath, fieldMeta) => ({ type, value }) => ({
  [fieldPath]: {
    [type === 'not_matches' ? 'notIn' : 'in']: value,
  },
})
```
**Impact**: GraphQL type validation errors for select fields with integer/enum options.

### 5. **Field Controller Context Differences**
**Status**: ⚠️ **Potential Issue**  
**Files**: `features/dashboard/utils/enhanceFields.ts`

**Issue**: Field controller creation might miss Keystone context:
- Missing `adminMeta` context
- Missing list relationship metadata  
- Missing permission context for field visibility

**Impact**: Field controllers might not behave identically to Keystone's implementation.

### 6. **Cards/Inline Create/Edit Functionality**
**Status**: ✅ **IMPLEMENTED** with ⚠️ **Minor Issues**  
**Files**: `features/dashboard/views/relationship/client/`

**What's Working**:
- ✅ Cards display mode implemented (`Cards.tsx`)
- ✅ Inline create functionality implemented (`CreateItemDrawer.tsx`)
- ✅ Field controller supports cards-view mode (lines 315-324 in relationship controller)
- ✅ Client Field component handles cards-view properly (lines 140-164)
- ✅ Create item drawer with full form functionality
- ✅ Badge display with remove functionality
- ✅ External link buttons for viewing related items

**Minor Issues Found**:
- ⚠️ **Missing inline edit functionality** - Cards component doesn't implement inline editing of existing items
- ⚠️ **Cards serialization might have issues** - Need to verify cards-view serialization in controller (lines 429-457)

**Implementation Quality**: Very close to Keystone's implementation with proper drawer, form handling, and relationship management.

## 🟢 **MEDIUM PRIORITY ISSUES**

### 7. **URL Parameter vs Router Query Handling**
**Status**: ⚠️ **Inconsistent**  
**Files**: Multiple filter components

**Issue**: Mixed usage of `useSearchParams()` with manual URLSearchParams vs Keystone's router query approach.
**Impact**: Filter state synchronization issues, browser navigation problems.

### 8. **Error Handling Pattern Differences**
**Status**: ⚠️ **Inconsistent**  
**Files**: Throughout server actions

**Issue**: Custom response objects vs Keystone's thrown exceptions:
```typescript
// Our pattern:
return { success: false, error: 'message' }

// Keystone pattern:
throw new Error('message') // Caught by error boundaries
```
**Impact**: Error boundaries and error recovery might not work as expected.

### 9. **Missing Field Types in GraphQL Selection**
**Status**: 🚫 **Missing**  
**Files**: `features/dashboard/actions/getListItemsAction.ts`

**Missing from `FIELD_GRAPHQL_SELECTIONS`:**
- ❌ Image fields
- ❌ Virtual fields  
- ❌ JSON fields

### 10. **Text Field Mode Sensitivity Access Pattern**
**Status**: ⚠️ **Potential Issue**  
**Files**: `features/dashboard/lib/buildWhereClause.ts`

**Issue**: Different access patterns to `shouldUseModeInsensitive`:
```typescript
// Field controller: config.fieldMeta.shouldUseModeInsensitive
// Server mapping: fieldMeta?.shouldUseModeInsensitive
```

## 🟢 **LOW PRIORITY ISSUES**

### 11. **Data Fetching Cache Strategy**
**Status**: 🔄 **Different Implementation**

**Issue**: Server actions don't implement Apollo client caching strategies:
- No optimistic updates
- No normalized cache  
- Different revalidation patterns

### 12. **Field Validation Timing**
**Status**: 🔄 **Different Implementation**

**Issue**: Server-side validation happens at different points than Keystone's client-side validation.

## **IMPLEMENTATION PLAN**

### Phase 1: Critical Fixes (Immediate)
1. ✅ **Fix authentication headers** (COMPLETED)
2. 🔲 **Add missing field types to filter mappings**
3. 🔲 **Fix GraphQL selection mismatches** 
4. 🔲 **Investigate and fix cards/inline create/edit**

### Phase 2: High Priority (Next Sprint)
1. 🔲 **Implement select field value transformation**
2. 🔲 **Enhance field controller context**
3. 🔲 **Add missing field types to GraphQL selections**

### Phase 3: Medium Priority (Future Sprint)
1. 🔲 **Standardize URL state management**
2. 🔲 **Align error handling patterns**
3. 🔲 **Fix text field mode sensitivity access**

### Phase 4: Nice to Have (Future)
1. 🔲 **Implement caching strategies**
2. 🔲 **Align validation timing**

## **TESTING CHECKLIST**

After implementing fixes, test these scenarios:

### Critical Functionality Tests
- [ ] Document field filtering works
- [ ] JSON field filtering works  
- [ ] Image field filtering works
- [ ] Relationship count display mode works
- [ ] Relationship cards display works
- [ ] Inline create functionality works
- [ ] Inline edit functionality works

### Advanced Filtering Tests
- [ ] Select fields with integer options filter correctly
- [ ] Text field case sensitivity works properly
- [ ] Complex document relationships load correctly
- [ ] Virtual field GraphQL selections work

### Navigation & State Tests  
- [ ] Filter state preserved on navigation
- [ ] Browser back/forward works with filters
- [ ] URL parameters sync correctly
- [ ] Error boundaries catch GraphQL errors properly

## **BREAKING CHANGE SCENARIOS**

These scenarios will currently fail or behave unexpectedly:

1. **Document field filtering** → Complete failure, no server-side filtering
2. **Relationship count display** → Wrong GraphQL query, data fetch failure
3. **Select fields with integer options** → GraphQL type validation errors  
4. **Image field filtering** → Complete failure
5. **Cards mode relationships** → Unknown status, needs investigation
6. **Inline create/edit** → Unknown status, needs investigation

## **KEYSTONE COMPLIANCE SCORE**

**Current Compliance**: ~70%  
**Target Compliance**: 95%+

**Major gaps**: Missing field type support, GraphQL selection mismatches, unknown cards/inline functionality status.

---

*Last Updated: 2025-01-29*  
*Next Review: After Phase 1 completion*