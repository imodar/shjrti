import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, Clock, AlertTriangle } from "lucide-react";

const MaintenancePage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-2 border-primary/20 shadow-2xl">
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                  <Wrench className="w-12 h-12 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2">
                  <Badge variant="secondary" className="animate-bounce">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    صيانة
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-primary">
                الموقع تحت الصيانة
              </CardTitle>
              <p className="text-muted-foreground text-lg">
                نعتذر للإزعاج، نحن نعمل على تحسين خدماتنا
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-8 pb-12">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  الوقت الحالي: {currentTime.toLocaleString('ar-SA')}
                </span>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-6 space-y-3">
                <h3 className="font-semibold text-lg">ما الذي نعمل عليه؟</h3>
                <ul className="text-sm text-muted-foreground space-y-2 text-center">
                  <li>• تحسين الأداء والسرعة</li>
                  <li>• إضافة ميزات جديدة</li>
                  <li>• تحديثات الأمان</li>
                  <li>• تحسين تجربة المستخدم</li>
                </ul>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm font-medium text-primary">
                  سنعود قريباً بتحسينات رائعة! 
                  <br />
                  <span className="text-muted-foreground">
                    شكراً لصبركم وتفهمكم
                  </span>
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="flex space-x-1 rtl:space-x-reverse">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MaintenancePage;