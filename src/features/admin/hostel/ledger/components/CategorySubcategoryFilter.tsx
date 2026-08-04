import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/core/components/select";

interface CategorySubcategoryFilterProps {
  categories: Array<{ id: string; name: string }>;
  subcategories: Array<{ id: string; name: string; categoryId: string }>;
  categoryValue: string;
  subcategoryValue: string;
  onCategoryChange: (value: string) => void;
  onSubcategoryChange: (value: string) => void;
  disabled?: boolean;
}

export function CategorySubcategoryFilter({
  categories,
  subcategories,
  categoryValue,
  subcategoryValue,
  onCategoryChange,
  onSubcategoryChange,
  disabled = false,
}: CategorySubcategoryFilterProps) {
  // Get subcategories for the selected category
  const filteredSubcategories = categoryValue === "ALL"
    ? subcategories
    : subcategories.filter((sub) => sub.categoryId === categoryValue);

  // Reset subcategory filter when category changes
  const handleCategoryChange = (value: string) => {
    onCategoryChange(value);
    if (value !== categoryValue) {
      onSubcategoryChange("ALL");
    }
  };

  return (
    <div className="flex gap-3 items-center flex-wrap">
      <Select value={categoryValue} onValueChange={handleCategoryChange} disabled={disabled}>
        <SelectTrigger className="h-10 text-sm w-full md:w-max">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={subcategoryValue} onValueChange={onSubcategoryChange} disabled={disabled}>
        <SelectTrigger className="h-10 text-sm w-full md:w-max">
          <SelectValue placeholder="All Subcategories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Subcategories</SelectItem>
          {filteredSubcategories.map((subcategory) => (
            <SelectItem key={subcategory.id} value={subcategory.id}>
              {subcategory.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
