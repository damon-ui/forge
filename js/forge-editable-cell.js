/**
 * FORGE EditableCell Component
 * Inline editing system for comparison tables
 * 
 * @version 1.0.0
 * @requires AppState (global) - tool's state object with editMode, changes, originalData
 * @requires COMPARISON_FIELDS (global) - field definitions array
 * @requires formatDate() (global) - date formatting function
 * @requires formatPrice() (global) - price formatting function
 * @requires window.ForgeUtils - FORGE utility library
 */

// Track active EditableCell instances
const editableCells = new Map();

class EditableCell {
  constructor(element) {
    this.element = element;
    this.optionId = element.dataset.optionId;
    this.fieldKey = element.dataset.fieldKey;
    this.fieldType = element.dataset.fieldType;
    this.originalValue = element.dataset.originalValue || '';
    this.currentValue = this.originalValue;
    this.isEditing = false;
    
    // Store reference
    const cellKey = `${this.optionId}::${this.fieldKey}`;
    editableCells.set(cellKey, this);
    
    // Check if already has changes from AppState
    if (AppState.changes.has(cellKey)) {
      this.currentValue = AppState.changes.get(cellKey);
      this.element.classList.add('changed');
    }
    
    this.setupClickHandler();
  }
  
  setupClickHandler() {
    this.element.addEventListener('click', (e) => {
      if (AppState.editMode && !this.isEditing) {
        e.stopPropagation();
        this.enterEditMode();
      }
    });
  }
  
  enterEditMode() {
    if (this.isEditing) return;
    this.isEditing = true;
    
    // Store original display content for cancel
    this.originalDisplayHTML = this.element.innerHTML;
    
    // Clear and add input
    this.element.innerHTML = '';
    const input = this.createInput();
    this.element.appendChild(input);
    
    // Style for editing
    this.element.classList.add('editing');
    
    // TRN-119: List editors handle their own events, skip standard handlers
    const listFields = ['inclusions', 'exclusions', 'itinerary'];
    const isListEditor = listFields.includes(this.fieldKey);
    
    if (isListEditor) {
      // For list editors, focus the first input if available
      const firstInput = input.querySelector('input');
      if (firstInput) firstInput.focus();
      return; // List editor handles its own save/cancel
    }
    
    // Focus and select (for non-list inputs)
    input.focus();
    if (input.select) input.select();
    
    // Event handlers
    input.addEventListener('blur', (e) => {
      // Small delay to allow Tab to work properly
      setTimeout(() => {
        if (this.isEditing) {
          this.saveValue(input.value);
        }
      }, 100);
    });
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.saveValue(input.value);
        this.moveToNextCell(false);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.cancelEdit();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        this.saveValue(input.value);
        this.moveToNextCell(e.shiftKey);
      }
    });
    
    // For select elements, also save on change for immediate feedback
    if (this.fieldType === 'select') {
      input.addEventListener('change', () => {
        this.saveValue(input.value);
      });
    }
  }
  
  createInput() {
    // TRN-119: Detect list fields and use list editor instead
    const listFields = ['inclusions', 'exclusions', 'itinerary'];
    if (listFields.includes(this.fieldKey)) {
      return this.createListEditor();
    }
    
    let input;
    
    switch(this.fieldType) {
      case 'date':
        input = document.createElement('input');
        input.type = 'date';
        // Convert display date back to ISO format for date input
        input.value = this.currentValue || '';
        break;
        
      case 'price':
        input = document.createElement('input');
        input.type = 'number';
        // Strip formatting to get raw number
        const numValue = String(this.currentValue).replace(/[^0-9.-]/g, '');
        input.value = numValue || '0';
        input.step = '1';
        input.min = '0';
        break;
        
      case 'number':
        input = document.createElement('input');
        input.type = 'number';
        input.value = this.currentValue || '0';
        input.min = '0';
        break;
      
      case 'select':
        // Look up field definition to get options
        const fieldDef = COMPARISON_FIELDS.find(f => f.key === this.fieldKey);
        const options = fieldDef?.options || [];
        
        input = document.createElement('select');
        
        // Add empty option
        const emptyOpt = document.createElement('option');
        emptyOpt.value = '';
        emptyOpt.textContent = '-- Select --';
        input.appendChild(emptyOpt);
        
        // Add options
        options.forEach(optValue => {
          const opt = document.createElement('option');
          opt.value = optValue;
          opt.textContent = optValue;
          if (optValue === this.currentValue) {
            opt.selected = true;
          }
          input.appendChild(opt);
        });
        break;
        
      default: // text
        input = document.createElement('input');
        input.type = 'text';
        input.value = this.currentValue || '';
    }
    
    input.className = 'w-full px-2 py-1 border-2 border-amber-400 rounded text-sm focus:outline-none focus:border-amber-500';
    input.style.minWidth = '100px';
    return input;
  }
  
  // TRN-119: List editor for inclusions, exclusions, itinerary fields
  createListEditor() {
    // Parse current value into items array
    const currentItems = this.currentValue 
      ? this.currentValue.split(',').map(s => s.trim()).filter(s => s)
      : [];
    
    // Create container
    const container = document.createElement('div');
    container.className = 'list-editor p-2 bg-white rounded border-2 border-amber-400';
    container.style.minWidth = '200px';
    
    // Store items array for later collection
    this.listItems = [...currentItems];
    
    // Build item rows
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'list-items space-y-1 mb-2';
    itemsContainer.id = `list-items-${this.optionId}-${this.fieldKey}`;
    
    // Render existing items
    currentItems.forEach((item, index) => {
      itemsContainer.appendChild(this.createListItemRow(item, index));
    });
    
    // Add new item row
    const addRow = document.createElement('div');
    addRow.className = 'flex gap-1 items-center mb-2';
    
    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.placeholder = 'Add new item...';
    newInput.className = 'flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-amber-500';
    newInput.id = `list-new-${this.optionId}-${this.fieldKey}`;
    
    // Handle Enter key on new item input
    newInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        this.addListItem(newInput.value);
        newInput.value = '';
        newInput.focus();
      }
    });
    
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.innerHTML = '&#43;';
    addBtn.className = 'px-2 py-1 text-white rounded text-sm font-bold';
    addBtn.style.background = 'var(--btn-create)';
    addBtn.title = 'Add item';
    addBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.addListItem(newInput.value);
      newInput.value = '';
      newInput.focus();
    };
    
    addRow.appendChild(newInput);
    addRow.appendChild(addBtn);
    
    // Action buttons
    const buttonRow = document.createElement('div');
    buttonRow.className = 'flex gap-2 justify-end pt-2 border-t border-gray-200';
    
    const doneBtn = document.createElement('button');
    doneBtn.type = 'button';
    doneBtn.textContent = 'Done';
    doneBtn.className = 'px-3 py-1 text-white rounded text-sm font-medium';
    doneBtn.style.background = 'var(--btn-create)';
    doneBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.saveListValue();
    };
    
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'px-3 py-1 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50';
    cancelBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.cancelEdit();
    };
    
    buttonRow.appendChild(cancelBtn);
    buttonRow.appendChild(doneBtn);
    
    // Assemble container
    container.appendChild(itemsContainer);
    container.appendChild(addRow);
    container.appendChild(buttonRow);
    
    // Prevent blur from closing editor when clicking inside
    container.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
    
    return container;
  }
  
  // Create a single list item row with input and delete button
  createListItemRow(value, index) {
    const row = document.createElement('div');
    row.className = 'flex gap-1 items-center list-item-row';
    row.dataset.index = index;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.className = 'flex-1 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:border-amber-400';
    input.dataset.index = index;
    
    // Update listItems on change
    input.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.index);
      this.listItems[idx] = e.target.value;
    });
    
    // Handle Enter to add new item
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        // Focus the "add new" input
        const newInput = document.getElementById(`list-new-${this.optionId}-${this.fieldKey}`);
        if (newInput) newInput.focus();
      }
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.innerHTML = '&#128465;'; // Trash can emoji as HTML entity
    deleteBtn.className = 'px-1 text-gray-400 hover:text-red-500 transition';
    deleteBtn.title = 'Remove item';
    deleteBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.removeListItem(index);
    };
    
    row.appendChild(input);
    row.appendChild(deleteBtn);
    
    return row;
  }
  
  // Add a new item to the list
  addListItem(value) {
    const trimmed = value.trim();
    if (!trimmed) return;
    
    this.listItems.push(trimmed);
    
    // Re-render items container
    const itemsContainer = document.getElementById(`list-items-${this.optionId}-${this.fieldKey}`);
    if (itemsContainer) {
      itemsContainer.appendChild(this.createListItemRow(trimmed, this.listItems.length - 1));
    }
  }
  
  // Remove an item from the list
  removeListItem(index) {
    this.listItems.splice(index, 1);
    
    // Re-render all items to fix indices
    const itemsContainer = document.getElementById(`list-items-${this.optionId}-${this.fieldKey}`);
    if (itemsContainer) {
      itemsContainer.innerHTML = '';
      this.listItems.forEach((item, idx) => {
        itemsContainer.appendChild(this.createListItemRow(item, idx));
      });
    }
  }
  
  // Save the list value (called by Done button)
  saveListValue() {
    // Collect all current values from inputs (in case user edited them)
    const itemsContainer = document.getElementById(`list-items-${this.optionId}-${this.fieldKey}`);
    if (itemsContainer) {
      const inputs = itemsContainer.querySelectorAll('input');
      this.listItems = Array.from(inputs).map(input => input.value.trim()).filter(v => v);
    }
    
    // Join with comma-space for storage
    const joinedValue = this.listItems.join(', ');
    this.saveValue(joinedValue);
  }
  
  saveValue(newValue) {
    if (!this.isEditing) return;
    this.isEditing = false;
    
    // Remove editing style
    this.element.classList.remove('editing');
    
    // Validate
    if (!this.validate(newValue)) {
      window.ForgeUtils?.UI?.showToast('Invalid value', 'error');
      this.cancelEdit();
      return;
    }
    
    // Store the raw value
    this.currentValue = newValue;
    
    // Check if changed from original
    const cellKey = `${this.optionId}::${this.fieldKey}`;
    const hasChanged = newValue !== this.originalValue;
    
    if (hasChanged) {
      // Track change
      AppState.changes.set(cellKey, newValue);
      if (!AppState.originalData.has(cellKey)) {
        AppState.originalData.set(cellKey, this.originalValue);
      }
      this.element.classList.add('changed');
    } else {
      // Reverted to original - remove from tracking
      AppState.changes.delete(cellKey);
      AppState.originalData.delete(cellKey);
      this.element.classList.remove('changed');
    }
    
    // Update display with formatted value
    this.element.innerHTML = this.formatDisplay(newValue);
    
    // Update change counter
    updateChangeCount();
    
    // Update calculated fields if needed
    this.updateDependentFields();
  }
  
  validate(value) {
    switch(this.fieldType) {
      case 'date':
        // Allow empty or valid date
        if (!value || value === '') return true;
        return !isNaN(Date.parse(value));
      case 'price':
      case 'number':
        // Allow empty or valid non-negative number
        if (value === '' || value === null) return true;
        const num = parseFloat(value);
        return !isNaN(num) && num >= 0;
      default:
        return true; // Text allows anything
    }
  }
  
  formatDisplay(value) {
    if (!value && value !== 0) {
      return '<span class="text-gray-400 italic">Not specified</span>';
    }
    
    switch(this.fieldType) {
      case 'date':
        return formatDate(value);
      case 'price':
        return formatPrice(value);
      case 'number':
        return value.toString();
      default:
        // TRN-119: Render list fields as bullet points after editing
        const listFields = ['inclusions', 'exclusions', 'itinerary'];
        if (listFields.includes(this.fieldKey) && typeof value === 'string' && value.includes(',')) {
          const items = value.split(',').map(s => s.trim()).filter(s => s);
          if (items.length > 1) {
            return '<ul class="list-disc list-inside space-y-1 text-sm text-left">' + 
              items.map(item => `<li>${item}</li>`).join('') + '</ul>';
          }
        }
        return value;
    }
  }
  
  cancelEdit() {
    if (!this.isEditing) return;
    this.isEditing = false;
    
    // Restore original display
    this.element.classList.remove('editing');
    this.element.innerHTML = this.originalDisplayHTML;
  }
  
  moveToNextCell(reverse = false) {
    // Find all editable cells in the same row
    const row = this.element.closest('tr');
    if (!row) return;
    
    const cells = Array.from(row.querySelectorAll('.editable-cell'));
    const currentIndex = cells.indexOf(this.element);
    
    console.log('moveToNextCell: currentIndex =', currentIndex, 'of', cells.length, 'cells');
    
    if (currentIndex === -1) {
      console.log('moveToNextCell: current cell not found in row');
      return;
    }
    
    // Calculate next index (stop at row boundaries)
    let nextIndex;
    if (reverse) {
      nextIndex = currentIndex - 1;
      if (nextIndex < 0) {
        console.log('moveToNextCell: at start of row, stopping');
        return;
      }
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= cells.length) {
        console.log('moveToNextCell: at end of row, stopping');
        return;
      }
    }
    
    console.log('moveToNextCell: moving to index', nextIndex);
    
    const nextCell = cells[nextIndex];
    if (nextCell) {
      // Small delay to let current cell finish saving
      setTimeout(() => {
        // Trigger click on next cell to enter edit mode
        nextCell.click();
      }, 50);
    }
  }
  
  updateDependentFields() {
    // Find the option data
    const option = AppState.loadedOptions.find(opt => opt.binId === this.optionId);
    if (!option) return;
    
    // Apply current changes to a working copy
    const workingOption = { ...option };
    AppState.changes.forEach((value, key) => {
      const [optId, fieldKey] = key.split('::');
      if (optId === this.optionId) {
        workingOption[fieldKey] = value;
      }
    });
    
    // Check which calculated fields need updating
    const pricingFields = ['packagePrice', 'flightsPrice', 'guests'];
    const dateFields = ['startDate', 'endDate'];
    
    if (pricingFields.includes(this.fieldKey)) {
      // Calculate new grandTotal first
      const grandTotalField = COMPARISON_FIELDS.find(f => f.key === 'grandTotal');
      if (grandTotalField && grandTotalField.calculate) {
        workingOption.grandTotal = grandTotalField.calculate(workingOption);
      }
      
      // Update grandTotal display
      this.updateCalculatedCell('grandTotal', workingOption);
      // Update pricePerPerson (now using updated grandTotal)
      this.updateCalculatedCell('pricePerPerson', workingOption);
    }
    
    if (dateFields.includes(this.fieldKey)) {
      // Update duration
      this.updateCalculatedCell('duration', workingOption);
    }
    
    // If guests changed, also update pricePerPerson
    if (this.fieldKey === 'guests') {
      this.updateCalculatedCell('pricePerPerson', workingOption);
    }
  }
  
  updateCalculatedCell(fieldKey, workingOption) {
    const field = COMPARISON_FIELDS.find(f => f.key === fieldKey);
    if (!field || !field.calculate) return;
    
    const cellId = `cell-${this.optionId}-${fieldKey}`;
    const cell = document.getElementById(cellId);
    if (!cell) return;
    
    // Calculate new value
    const newValue = field.calculate(workingOption);
    
    // Format and display (handle 0 as valid value)
    if (field.type === 'calculated-price') {
      cell.innerHTML = formatPrice(newValue);
    } else {
      const isEmpty = newValue === '' || newValue === null || newValue === undefined;
      cell.innerHTML = isEmpty ? '<span class="text-gray-400 italic">N/A</span>' : newValue;
    }
  }
}

// Setup editable cells after table renders
function setupEditableCells() {
  // Clear old references
  editableCells.clear();
  
  // Create EditableCell instances for each editable cell
  document.querySelectorAll('.editable-cell').forEach(cell => {
    new EditableCell(cell);
  });
  
  console.log(`Setup ${editableCells.size} editable cells`);
}

// Update the change counter display
function updateChangeCount() {
  const countEl = document.getElementById('changeCount');
  if (countEl) {
    countEl.textContent = AppState.changes.size;
  }
  
  // Also update save button state
  const saveBtn = document.querySelector('[onclick="saveChanges()"]');
  if (saveBtn) {
    if (AppState.changes.size > 0) {
      saveBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      saveBtn.removeAttribute('disabled');
    } else {
      saveBtn.classList.add('opacity-50', 'cursor-not-allowed');
      saveBtn.setAttribute('disabled', 'true');
    }
  }
}
