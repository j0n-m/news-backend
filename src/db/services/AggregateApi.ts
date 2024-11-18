import { Aggregate } from "mongoose";
import { SearchQuery } from "../../types/searchParams.js";

class AggregateApi {
  public aggregation: Aggregate<any[]>;
  private query: SearchQuery;
  constructor(aggregation: Aggregate<any[]>, query: SearchQuery) {
    this.aggregation = aggregation;
    this.query = query;
  }
  sort() {
    // "test,-test"
    if (this.query.sort) {
      const sortFields = this.query.sort.split(",");

      sortFields.forEach((fields: string) => {
        const hasMinusSymbol = /-/.test(fields);
        let field = hasMinusSymbol ? fields.slice(1) : fields;
        this.aggregation.append({
          $sort: {
            [field]: hasMinusSymbol ? -1 : 1,
          },
        });
      });

      return this.aggregation;
    }
  }
  project() {
    if (this.query.project) {
      const projectFields = this.query.project.split(",");
      projectFields.forEach((fields: string) => {
        const hasMinusSymbol = /-/.test(fields);
        let field = hasMinusSymbol ? fields.slice(1) : fields;
        this.aggregation.append({
          $project: {
            [field]: hasMinusSymbol ? 0 : 1,
          },
        });
      });
    } else {
      this.aggregation.append({
        $project: {
          __v: 0,
        },
      });
    }
  }
}
export default AggregateApi;
